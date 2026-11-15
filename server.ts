import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';

// Strict allowlist for proxied satellite browse imagery (prevents SSRF)
const ALLOWED_BROWSE_HOSTS = [
  'asf.alaska.edu',
  'earthdata.nasa.gov',
  'nasa.gov',
  'jpl.nasa.gov',
];

function isAllowedBrowseHost(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_BROWSE_HOSTS.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

function getEarthdataToken(req: express.Request): string | null {
  const headerToken = req.header('x-earthdata-token')?.trim();
  if (headerToken) return headerToken;
  const envToken = process.env.EARTHDATA_TOKEN?.trim();
  return envToken || null;
}

interface NormalizedGranule {
  id: string;
  granuleName: string;
  platform: string;
  sensor: string;
  band: string;
  processingLevel: string;
  beamMode: string;
  polarization: string;
  flightDirection: string;
  startTime: string;
  stopTime: string;
  centerLat: number;
  centerLon: number;
  polygon: Array<[number, number]>; // [lat, lon]
  browseUrls: string[];
  downloadUrl: string | null;
  sourceApi: 'ASF Search API' | 'NASA CMR API';
  availabilityStatus: 'Public Browse & Metadata' | 'Earthdata Login Required for Data Download';
  collectionShortName: string;
}

function computeRingCenter(ring: Array<[number, number]>): [number, number] {
  if (ring.length === 0) return [0, 0];
  let sumLat = 0;
  let sumLon = 0;
  for (const [lat, lon] of ring) {
    sumLat += lat;
    sumLon += lon;
  }
  return [sumLat / ring.length, sumLon / ring.length];
}

function inferBand(platform: string): string {
  const p = platform.toUpperCase();
  if (p.includes('NISAR') || p.includes('ALOS') || p.includes('UAVSAR') || p.includes('SAOCOM')) {
    return 'L-Band (24 cm)';
  }
  if (p.includes('SENTINEL') || p.includes('RADARSAT') || p.includes('RCM')) {
    return 'C-Band (5.6 cm)';
  }
  return 'Microwave SAR';
}

async function createApp() {
  const app = express();
  app.use(express.json());

  // Health & Capability Endpoint
  app.get('/api/sar/health', (_req, res) => {
    res.json({
      status: 'operational',
      serverTokenConfigured: Boolean(process.env.EARTHDATA_TOKEN?.trim()),
      endpoints: {
        asfSearch: 'https://api.daac.asf.alaska.edu/services/search/param',
        nasaCmr: 'https://cmr.earthdata.nasa.gov/search/granules.json',
        nasaEonet: 'https://eonet.gsfc.nasa.gov/api/v3/events',
      },
    });
  });

  // 1. Live SAR Granule Search (ASF Search GeoJSON + NASA CMR)
  app.get('/api/sar/search', async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const radiusDeg = Math.max(0.25, Math.min(12, Number(req.query.radiusDeg || 2.5)));
    const platformParam = String(req.query.platform || 'SENTINEL-1').trim();
    const start = String(req.query.start || '').trim();
    const end = String(req.query.end || '').trim();
    const maxResults = Math.max(1, Math.min(25, Number(req.query.maxResults || 12)));
    const shortName = String(req.query.shortName || '').trim();

    const token = getEarthdataToken(req);

    // Map mission aliases to ASF & CMR parameters
    const upperPlatform = platformParam.toUpperCase();
    const useCmrDirectly =
      upperPlatform === 'NISAR' || Boolean(shortName);

    const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lon);
    const minLon = hasValidCoords ? Math.max(-180, lon - radiusDeg) : -180;
    const maxLon = hasValidCoords ? Math.min(180, lon + radiusDeg) : 180;
    const minLat = hasValidCoords ? Math.max(-89, lat - radiusDeg) : -85;
    const maxLat = hasValidCoords ? Math.min(89, lat + radiusDeg) : 85;

    const granules: NormalizedGranule[] = [];
    const upstreamNotes: string[] = [];
    let upstreamOk = false;

    // Query ASF Search GeoJSON API for S1, ALOS, UAVSAR, RADARSAT-1
    if (!useCmrDirectly || upperPlatform === 'ALL') {
      try {
        const asfUrl = new URL('https://api.daac.asf.alaska.edu/services/search/param');
        asfUrl.searchParams.set('output', 'geojson');
        asfUrl.searchParams.set('maxResults', String(maxResults));

        if (upperPlatform === 'ALL') {
          asfUrl.searchParams.set('platform', 'SENTINEL-1,ALOS,UAVSAR,RADARSAT-1');
        } else if (upperPlatform === 'ALOS PALSAR') {
          asfUrl.searchParams.set('platform', 'ALOS');
        } else if (upperPlatform === 'RADARSAT') {
          asfUrl.searchParams.set('platform', 'RADARSAT-1');
        } else {
          asfUrl.searchParams.set('platform', upperPlatform);
        }

        if (hasValidCoords) {
          const wkt = `POLYGON((${minLon.toFixed(3)} ${minLat.toFixed(3)},${maxLon.toFixed(
            3
          )} ${minLat.toFixed(3)},${maxLon.toFixed(3)} ${maxLat.toFixed(
            3
          )},${minLon.toFixed(3)} ${maxLat.toFixed(3)},${minLon.toFixed(3)} ${minLat.toFixed(3)}))`;
          asfUrl.searchParams.set('intersectsWith', wkt);
        }

        if (start) asfUrl.searchParams.set('start', start);
        if (end) asfUrl.searchParams.set('end', end);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 11000);
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'User-Agent': 'GlobalTime-SpaceApps/1.0',
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const asfRes = await fetch(asfUrl.toString(), {
          signal: controller.signal,
          headers,
        });
        clearTimeout(timeout);

        if (asfRes.ok) {
          upstreamOk = true;
          const geojson = (await asfRes.json()) as {
            features?: Array<{
              geometry?: { type?: string; coordinates?: unknown };
              properties?: Record<string, unknown>;
            }>;
          };

          for (const feat of geojson.features || []) {
            const props = feat.properties || {};
            let ring: Array<[number, number]> = [];
            if (
              feat.geometry?.type === 'Polygon' &&
              Array.isArray(feat.geometry.coordinates) &&
              Array.isArray(feat.geometry.coordinates[0])
            ) {
              ring = (feat.geometry.coordinates[0] as Array<[number, number]>).map(
                ([gLon, gLat]) => [Number(gLat), Number(gLon)]
              );
            } else if (
              feat.geometry?.type === 'MultiPolygon' &&
              Array.isArray(feat.geometry.coordinates) &&
              Array.isArray((feat.geometry.coordinates as unknown[])[0])
            ) {
              const firstPoly = (feat.geometry.coordinates as Array<Array<Array<[number, number]>>>)[0];
              if (firstPoly && firstPoly[0]) {
                ring = firstPoly[0].map(([gLon, gLat]) => [Number(gLat), Number(gLon)]);
              }
            }

            const [cLat, cLon] =
              ring.length > 0
                ? computeRingCenter(ring)
                : [Number(props.centerLat || lat || 0), Number(props.centerLon || lon || 0)];

            const rawBrowse = props.browse;
            const browseUrls = Array.isArray(rawBrowse)
              ? rawBrowse.filter((u): u is string => typeof u === 'string' && u.startsWith('http'))
              : typeof rawBrowse === 'string' && rawBrowse.startsWith('http')
              ? [rawBrowse]
              : [];

            const platformLabel = String(props.platform || platformParam);
            granules.push({
              id: String(props.sceneName || props.fileID || Math.random()),
              granuleName: String(props.sceneName || props.fileName || 'SAR Granule'),
              platform: platformLabel,
              sensor: String(props.sensor || 'SAR'),
              band: inferBand(platformLabel),
              processingLevel: String(props.processingLevel || 'L1/L2'),
              beamMode: String(props.beamModeType || props.beamMode || 'IW'),
              polarization: String(props.polarization || 'Dual-Pol'),
              flightDirection: String(props.flightDirection || 'ASCENDING'),
              startTime: String(props.startTime || ''),
              stopTime: String(props.stopTime || ''),
              centerLat: cLat,
              centerLon: cLon,
              polygon: ring,
              browseUrls,
              downloadUrl: typeof props.url === 'string' ? props.url : null,
              sourceApi: 'ASF Search API',
              availabilityStatus:
                browseUrls.length > 0
                  ? 'Public Browse & Metadata'
                  : 'Earthdata Login Required for Data Download',
              collectionShortName: String(props.dataset || platformLabel),
            });
          }
        } else {
          upstreamNotes.push(`ASF Search API returned HTTP ${asfRes.status}`);
        }
      } catch (err) {
        upstreamNotes.push(
          `ASF Search query failed: ${err instanceof Error ? err.message : 'Network error'}`
        );
      }
    }

    // Also query NASA CMR Granules API (especially for NISAR / UAVSAR / ARIA_S1_GUNW / ALOS_PSR_RTC_HIGH)
    if (useCmrDirectly || granules.length < 4) {
      try {
        const cmrUrl = new URL('https://cmr.earthdata.nasa.gov/search/granules.json');
        cmrUrl.searchParams.set('page_size', String(maxResults));
        cmrUrl.searchParams.set('provider', 'ASF');

        if (shortName) {
          cmrUrl.searchParams.set('short_name', shortName);
        } else if (upperPlatform === 'NISAR' || upperPlatform === 'ALL') {
          cmrUrl.searchParams.append('short_name[]', 'NISAR_L2_GCOV_PROVISIONAL_V1');
          cmrUrl.searchParams.append('short_name[]', 'NISAR_L2_GUNW_PROVISIONAL_V1');
          cmrUrl.searchParams.append('short_name[]', 'NISAR_L2_GOFF_PROVISIONAL_V1');
          cmrUrl.searchParams.append('short_name[]', 'NISAR_L3_SME2_PROVISIONAL_V1');
        } else if (upperPlatform === 'UAVSAR') {
          cmrUrl.searchParams.set('platform', 'UAVSAR');
        } else if (upperPlatform === 'ALOS PALSAR') {
          cmrUrl.searchParams.set('short_name', 'ALOS_PSR_RTC_HIGH');
        } else if (upperPlatform === 'RADARSAT') {
          cmrUrl.searchParams.set('platform', 'RADARSAT-1');
        }

        if (hasValidCoords) {
          cmrUrl.searchParams.set(
            'bounding_box',
            `${minLon.toFixed(3)},${minLat.toFixed(3)},${maxLon.toFixed(3)},${maxLat.toFixed(3)}`
          );
        }
        if (start || end) {
          cmrUrl.searchParams.set('temporal', `${start || ''},${end || ''}`);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'User-Agent': 'GlobalTime-SpaceApps/1.0',
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const cmrRes = await fetch(cmrUrl.toString(), {
          signal: controller.signal,
          headers,
        });
        clearTimeout(timeout);

        if (cmrRes.ok) {
          upstreamOk = true;
          const cmrData = (await cmrRes.json()) as {
            feed?: {
              entry?: Array<{
                id: string;
                title: string;
                time_start?: string;
                time_end?: string;
                dataset_id?: string;
                polygons?: string[][];
                links?: Array<{ rel?: string; href?: string }>;
              }>;
            };
          };

          for (const entry of cmrData.feed?.entry || []) {
            const ring: Array<[number, number]> = [];
            const polyStr = entry.polygons?.[0]?.[0];
            if (polyStr) {
              const nums = polyStr.trim().split(/\s+/).map(Number);
              for (let i = 0; i + 1 < nums.length; i += 2) {
                if (Number.isFinite(nums[i]) && Number.isFinite(nums[i + 1])) {
                  ring.push([nums[i], nums[i + 1]]);
                }
              }
            }
            const [cLat, cLon] =
              ring.length > 0 ? computeRingCenter(ring) : [lat || 0, lon || 0];

            const browseUrls = (entry.links || [])
              .filter((l) => l.rel?.includes('/browse') && l.href?.startsWith('http'))
              .map((l) => l.href as string);

            const dataLink = (entry.links || []).find(
              (l) => l.rel?.includes('/data#') && l.href?.startsWith('http')
            );

            const datasetName = entry.dataset_id || shortName || platformParam;
            granules.push({
              id: entry.id,
              granuleName: entry.title,
              platform: upperPlatform === 'NISAR' ? 'NISAR' : platformParam,
              sensor: upperPlatform === 'NISAR' ? 'L-SAR / S-SAR' : 'SAR',
              band: inferBand(datasetName + ' ' + platformParam),
              processingLevel: datasetName.includes('GCOV')
                ? 'L2 GCOV'
                : datasetName.includes('GUNW')
                ? 'L2 GUNW'
                : 'CMR Granule',
              beamMode: 'SWATH',
              polarization: 'HH/HV',
              flightDirection: 'ORBITAL',
              startTime: entry.time_start || '',
              stopTime: entry.time_end || '',
              centerLat: cLat,
              centerLon: cLon,
              polygon: ring,
              browseUrls,
              downloadUrl: dataLink?.href || null,
              sourceApi: 'NASA CMR API',
              availabilityStatus:
                browseUrls.length > 0
                  ? 'Public Browse & Metadata'
                  : 'Earthdata Login Required for Data Download',
              collectionShortName: datasetName,
            });
          }
        } else {
          upstreamNotes.push(`NASA CMR API returned HTTP ${cmrRes.status}`);
        }
      } catch (err) {
        upstreamNotes.push(
          `NASA CMR query failed: ${err instanceof Error ? err.message : 'Network error'}`
        );
      }
    }

    res.json({
      ok: upstreamOk,
      count: granules.length,
      query: {
        lat: hasValidCoords ? lat : null,
        lon: hasValidCoords ? lon : null,
        radiusDeg,
        platform: platformParam,
        shortName: shortName || null,
      },
      authenticated: Boolean(token),
      upstreamNotes,
      granules,
    });
  });

  // 2. Live NASA CMR Collections Metadata Check (NISAR / UAVSAR / ALOS / S1 / RADARSAT)
  app.get('/api/sar/collections', async (_req, res) => {
    try {
      const nisarUrl = new URL('https://cmr.earthdata.nasa.gov/search/collections.json');
      nisarUrl.searchParams.set('provider', 'ASF');
      nisarUrl.searchParams.set('keyword', 'NISAR');
      nisarUrl.searchParams.set('page_size', '8');

      const asfTopUrl = new URL('https://cmr.earthdata.nasa.gov/search/collections.json');
      asfTopUrl.searchParams.set('provider', 'ASF');
      asfTopUrl.searchParams.set('sort_key', '-usage_score');
      asfTopUrl.searchParams.set('page_size', '12');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      const headers = {
        Accept: 'application/json',
        'User-Agent': 'GlobalTime-SpaceApps/1.0',
      };

      const [nisarRes, topRes] = await Promise.all([
        fetch(nisarUrl.toString(), { signal: controller.signal, headers }),
        fetch(asfTopUrl.toString(), { signal: controller.signal, headers }),
      ]);
      clearTimeout(timeout);

      if (!nisarRes.ok && !topRes.ok) {
        res.status(502).json({
          ok: false,
          error: `CMR returned HTTP ${nisarRes.status}`,
          collections: [],
        });
        return;
      }

      type CmrFeed = {
        feed?: {
          entry?: Array<{
            id: string;
            short_name?: string;
            title?: string;
            time_start?: string;
            time_end?: string;
            data_center?: string;
            processing_level_id?: string;
          }>;
        };
      };

      const nisarJson = nisarRes.ok ? ((await nisarRes.json()) as CmrFeed) : { feed: { entry: [] } };
      const topJson = topRes.ok ? ((await topRes.json()) as CmrFeed) : { feed: { entry: [] } };

      const seen = new Set<string>();
      const merged = [...(nisarJson.feed?.entry || []), ...(topJson.feed?.entry || [])].filter(
        (c) => {
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        }
      );

      res.json({
        ok: true,
        collections: merged.slice(0, 18).map((c) => ({
          conceptId: c.id,
          shortName: c.short_name || c.id,
          title: c.title || 'Untitled Collection',
          timeStart: c.time_start || null,
          timeEnd: c.time_end || 'Ongoing',
          dataCenter: c.data_center || 'ASF DAAC',
          processingLevel: c.processing_level_id || 'L1/L2',
        })),
      });
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to query NASA CMR collections',
        collections: [],
      });
    }
  });

  // 3. Live NASA EONET v3 Natural Events Feed (Real Wildfires, Floods, Storms, Ice)
  app.get('/api/sar/events', async (_req, res) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      const eonetRes = await fetch(
        'https://eonet.gsfc.nasa.gov/api/v3/events?limit=24&days=180&status=open',
        {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'GlobalTime-SpaceApps/1.0',
          },
        }
      );
      clearTimeout(timeout);

      if (!eonetRes.ok) {
        res.status(502).json({ ok: false, error: `EONET returned HTTP ${eonetRes.status}`, events: [] });
        return;
      }

      const data = (await eonetRes.json()) as {
        events?: Array<{
          id: string;
          title: string;
          link: string;
          categories?: Array<{ id: string; title: string }>;
          geometry?: Array<{ date: string; type: string; coordinates: [number, number] | number[][][] }>;
        }>;
      };

      const normalized = (data.events || [])
        .map((ev) => {
          const geom = ev.geometry?.[ev.geometry.length - 1];
          if (!geom) return null;
          let lon = 0;
          let lat = 0;
          if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
            lon = Number(geom.coordinates[0]);
            lat = Number(geom.coordinates[1]);
          } else {
            return null;
          }
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
          return {
            id: ev.id,
            title: ev.title,
            category: ev.categories?.[0]?.title || 'Environmental Event',
            categoryId: ev.categories?.[0]?.id || 'other',
            date: geom.date,
            lat,
            lon,
            link: ev.link,
          };
        })
        .filter(Boolean);

      res.json({ ok: true, events: normalized });
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to fetch NASA EONET events',
        events: [],
      });
    }
  });

  // 4. Safe Browse Quicklook Image Proxy (ASF / CMR / JPL only)
  app.get('/api/sar/browse', async (req, res) => {
    const rawUrl = String(req.query.url || '').trim();
    if (!rawUrl || !isAllowedBrowseHost(rawUrl)) {
      res.status(400).json({ error: 'Invalid or non-allowlisted NASA/ASF browse URL' });
      return;
    }

    const token = getEarthdataToken(req);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const headers: Record<string, string> = {
        'User-Agent': 'GlobalTime-SpaceApps/1.0',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const imgRes = await fetch(rawUrl, {
        signal: controller.signal,
        headers,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      if (imgRes.status === 401 || imgRes.status === 403) {
        res.status(401).json({
          error: 'NASA Earthdata Login authentication required to access this browse asset.',
          authRequired: true,
        });
        return;
      }

      if (!imgRes.ok) {
        res.status(imgRes.status).json({ error: `Upstream browse asset returned HTTP ${imgRes.status}` });
        return;
      }

      const contentType = imgRes.headers.get('content-type') || 'image/png';
      if (!contentType.startsWith('image/')) {
        res.status(401).json({
          error: 'Browse endpoint redirected to Earthdata Login portal; authentication required.',
          authRequired: true,
        });
        return;
      }

      const buf = Buffer.from(await imgRes.arrayBuffer());
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(buf);
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Failed to stream browse image',
      });
    }
  });

  // 5. Optional Earthdata Token Verification (Never stored on disk)
  app.post('/api/sar/verify-token', async (req, res) => {
    const token = String(req.body?.token || '').trim();
    if (!token) {
      res.status(400).json({ valid: false, message: 'No Earthdata token provided.' });
      return;
    }
    try {
      const testRes = await fetch(
        'https://cmr.earthdata.nasa.gov/search/collections.json?page_size=1',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );
      if (testRes.ok) {
        res.json({ valid: true, message: 'Token accepted by NASA CMR.' });
      } else {
        res.status(testRes.status).json({
          valid: false,
          message: `NASA CMR rejected token (HTTP ${testRes.status}).`,
        });
      }
    } catch (err) {
      res.status(502).json({
        valid: false,
        message: err instanceof Error ? err.message : 'Unable to reach NASA CMR.',
      });
    }
  });

  const httpServer = http.createServer(app);

  // Mount Vite Dev Middleware or Static Production Build
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: { server: httpServer },
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Global Time server listening on http://0.0.0.0:${PORT}`);
  });
}

createApp();
