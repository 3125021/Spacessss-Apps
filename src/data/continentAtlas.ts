import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry, Position } from 'geojson';
import countriesTopo from 'world-atlas/countries-110m.json';

export type ContinentId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ContinentMeta {
  id: Exclude<ContinentId, 0>;
  name: string;
  rgb: [number, number, number];
  highlandRgb: [number, number, number];
  hex: string;
}

export const CONTINENTS: Record<Exclude<ContinentId, 0>, ContinentMeta> = {
  1: {
    id: 1,
    name: 'North America',
    rgb: [16, 185, 129],
    highlandRgb: [52, 211, 153],
    hex: '#10b981',
  },
  2: {
    id: 2,
    name: 'South America',
    rgb: [245, 158, 11],
    highlandRgb: [251, 191, 36],
    hex: '#f59e0b',
  },
  3: {
    id: 3,
    name: 'Europe',
    rgb: [56, 189, 248],
    highlandRgb: [125, 211, 252],
    hex: '#38bdf8',
  },
  4: {
    id: 4,
    name: 'Africa',
    rgb: [251, 113, 133],
    highlandRgb: [253, 164, 175],
    hex: '#fb7185',
  },
  5: {
    id: 5,
    name: 'Asia',
    rgb: [139, 92, 246],
    highlandRgb: [167, 139, 250],
    hex: '#8b5cf6',
  },
  6: {
    id: 6,
    name: 'Oceania',
    rgb: [132, 204, 22],
    highlandRgb: [163, 230, 53],
    hex: '#84cc16',
  },
  7: {
    id: 7,
    name: 'Antarctica',
    rgb: [203, 213, 225],
    highlandRgb: [241, 245, 249],
    hex: '#cbd5e1',
  },
};

export const MODERN_OCEAN_SHALLOW: [number, number, number] = [10, 44, 88];
export const MODERN_OCEAN_DEEP: [number, number, number] = [4, 15, 34];

const ID_TO_CONTINENT: Record<string, Exclude<ContinentId, 0>> = {
  // North America
  '124': 1, '840': 1, '484': 1, '304': 1, '084': 1, '320': 1, '222': 1, '340': 1,
  '558': 1, '188': 1, '591': 1, '192': 1, '388': 1, '332': 1, '214': 1, '044': 1,
  '630': 1, '780': 1,
  // South America
  '170': 2, '862': 2, '328': 2, '740': 2, '218': 2, '604': 2, '076': 2, '068': 2,
  '600': 2, '858': 2, '152': 2, '032': 2, '238': 2,
  // Europe
  '826': 3, '372': 3, '352': 3, '620': 3, '724': 3, '250': 3, '056': 3, '528': 3,
  '442': 3, '756': 3, '380': 3, '276': 3, '208': 3, '578': 3, '752': 3, '246': 3,
  '233': 3, '428': 3, '440': 3, '616': 3, '203': 3, '703': 3, '040': 3, '348': 3,
  '705': 3, '191': 3, '070': 3, '688': 3, '499': 3, '008': 3, '807': 3, '300': 3,
  '100': 3, '642': 3, '498': 3, '804': 3, '112': 3,
  // Africa
  '504': 4, '732': 4, '012': 4, '788': 4, '434': 4, '818': 4, '478': 4, '466': 4,
  '562': 4, '148': 4, '729': 4, '728': 4, '232': 4, '262': 4, '231': 4, '706': 4,
  '686': 4, '270': 4, '624': 4, '324': 4, '694': 4, '430': 4, '384': 4, '854': 4,
  '288': 4, '768': 4, '204': 4, '566': 4, '120': 4, '226': 4, '266': 4, '178': 4,
  '180': 4, '140': 4, '800': 4, '404': 4, '646': 4, '108': 4, '834': 4, '024': 4,
  '894': 4, '454': 4, '508': 4, '716': 4, '072': 4, '516': 4, '710': 4, '426': 4,
  '748': 4, '450': 4,
  // Asia
  '792': 5, '196': 5, '760': 5, '422': 5, '376': 5, '275': 5, '400': 5, '682': 5,
  '887': 5, '512': 5, '784': 5, '634': 5, '414': 5, '368': 5, '364': 5, '268': 5,
  '051': 5, '031': 5, '398': 5, '860': 5, '795': 5, '417': 5, '762': 5, '004': 5,
  '586': 5, '356': 5, '524': 5, '064': 5, '050': 5, '144': 5, '104': 5, '764': 5,
  '418': 5, '116': 5, '704': 5, '458': 5, '096': 5, '360': 5, '626': 5, '608': 5,
  '156': 5, '496': 5, '158': 5, '408': 5, '410': 5, '392': 5, '643': 5,
  // Oceania
  '036': 6, '554': 6, '598': 6, '090': 6, '548': 6, '540': 6, '242': 6,
  // Antarctica
  '010': 7, '260': 7,
};

const NAME_TO_CONTINENT: Record<string, Exclude<ContinentId, 0>> = {
  Kosovo: 3,
  Somaliland: 4,
  'N. Cyprus': 5,
};

export interface ContinentAtlasBuffer {
  width: number;
  height: number;
  grid: Uint8Array;
}

let cachedAtlas: ContinentAtlasBuffer | null = null;

function resolveContinent(
  id: string | number | undefined,
  name: string | undefined,
  avgLon: number
): Exclude<ContinentId, 0> {
  const idStr = id !== undefined && id !== null ? String(id).padStart(3, '0') : '';
  // Handle transcontinental regions accurately
  if (idStr === '250') {
    // France: French Guiana lies west of -40°
    return avgLon < -40 ? 2 : 3;
  }
  if (idStr === '643') {
    // Russia: Ural divide around 60°E
    return avgLon < 60 && avgLon > -10 ? 3 : 5;
  }
  if (idStr === '792') {
    // Turkey: Bosporus / Thrace west of 28.9°E
    return avgLon < 28.9 ? 3 : 5;
  }

  if (idStr && ID_TO_CONTINENT[idStr]) {
    return ID_TO_CONTINENT[idStr];
  }
  if (name && NAME_TO_CONTINENT[name]) {
    return NAME_TO_CONTINENT[name];
  }
  return avgLon < -30 ? 1 : 5;
}

function unwrapRing(ring: Position[]): Position[] {
  if (ring.length === 0) return ring;
  const out: Position[] = [[ring[0][0], ring[0][1]]];
  for (let i = 1; i < ring.length; i++) {
    let lon = ring[i][0];
    const prevLon = out[i - 1][0];
    while (lon - prevLon > 180) lon -= 360;
    while (lon - prevLon < -180) lon += 360;
    out.push([lon, ring[i][1]]);
  }
  return out;
}

function drawPolygonRings(
  ctx: CanvasRenderingContext2D,
  rings: Position[][],
  width: number,
  height: number,
  isAntarcticaMain: boolean
) {
  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  for (const offset of [-width, 0, width]) {
    ctx.beginPath();
    for (let rIdx = 0; rIdx < rings.length; rIdx++) {
      const rawRing = rings[rIdx];
      if (rawRing.length < 3) continue;

      if (isAntarcticaMain && rIdx === 0) {
        // Trace coastline from -180 to +180 and close cleanly through the South Pole
        ctx.moveTo(toX(rawRing[0][0]) + offset, toY(rawRing[0][1]));
        for (let i = 1; i < rawRing.length; i++) {
          const prev = rawRing[i - 1];
          const curr = rawRing[i];
          if (Math.abs(curr[0] - prev[0]) > 180) {
            ctx.lineTo(toX(180) + offset, toY(-90));
            ctx.lineTo(toX(-180) + offset, toY(-90));
          }
          ctx.lineTo(toX(curr[0]) + offset, toY(curr[1]));
        }
        ctx.closePath();
      } else {
        const ring = unwrapRing(rawRing);
        ctx.moveTo(toX(ring[0][0]) + offset, toY(ring[0][1]));
        for (let i = 1; i < ring.length; i++) {
          ctx.lineTo(toX(ring[i][0]) + offset, toY(ring[i][1]));
        }
        ctx.closePath();
      }
    }
    ctx.fill('evenodd');
  }
}

export function getContinentAtlas(): ContinentAtlasBuffer | null {
  if (cachedAtlas) return cachedAtlas;
  if (typeof document === 'undefined') return null;

  const width = 1440;
  const height = 720;
  const grid = new Uint8Array(width * height);

  const topo = countriesTopo as unknown as Topology<{
    countries: GeometryCollection<{ name?: string }>;
  }>;
  const fc = feature(topo, topo.objects.countries) as FeatureCollection<
    Geometry,
    { name?: string }
  >;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Bucket polygon sets by continent (1..7)
  const buckets: Record<
    Exclude<ContinentId, 0>,
    Array<{ rings: Position[][]; isAntarcticaMain: boolean }>
  > = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
  };

  for (const feat of fc.features) {
    if (!feat.geometry) continue;
    const geom = feat.geometry;
    const polys: Position[][][] =
      geom.type === 'Polygon'
        ? [geom.coordinates]
        : geom.type === 'MultiPolygon'
        ? geom.coordinates
        : [];

    const idStr = feat.id !== undefined && feat.id !== null ? String(feat.id).padStart(3, '0') : '';

    for (const poly of polys) {
      const outer = poly[0];
      if (!outer || outer.length < 3) continue;

      let lonSum = 0;
      let hasJump = false;
      for (let i = 0; i < outer.length; i++) {
        lonSum += outer[i][0];
        if (i > 0 && Math.abs(outer[i][0] - outer[i - 1][0]) > 180) {
          hasJump = true;
        }
      }
      const avgLon = lonSum / outer.length;
      const cId = resolveContinent(feat.id, feat.properties?.name, avgLon);

      buckets[cId].push({
        rings: poly,
        isAntarcticaMain: idStr === '010' && hasJump,
      });
    }
  }

  // Render each continent in its own crisp monochrome pass to guarantee zero color bleed
  const continentOrder: Array<Exclude<ContinentId, 0>> = [1, 2, 3, 4, 5, 6, 7];
  for (const cId of continentOrder) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    for (const poly of buckets[cId]) {
      drawPolygonRings(ctx, poly.rings, width, height, poly.isAntarcticaMain);
    }
    const data = ctx.getImageData(0, 0, width, height).data;
    for (let i = 0, p = 0; i < grid.length; i++, p += 4) {
      if (data[p + 3] > 96) {
        grid[i] = cId;
      }
    }
  }

  // Guarantee complete South Pole closure down to -90°
  const polarStartRow = Math.floor(((90 + 85.2) / 180) * height);
  for (let y = polarStartRow; y < height; y++) {
    const rowOff = y * width;
    for (let x = 0; x < width; x++) {
      grid[rowOff + x] = 7;
    }
  }

  cachedAtlas = { width, height, grid };
  return cachedAtlas;
}

export function sampleContinentAtLatLon(
  atlas: ContinentAtlasBuffer,
  latDeg: number,
  lonDeg: number
): ContinentId {
  let normLon = ((lonDeg + 180) % 360 + 360) % 360;
  if (normLon >= 360) normLon -= 360;
  const x = Math.min(atlas.width - 1, Math.max(0, Math.floor((normLon / 360) * atlas.width)));
  const clampedLat = Math.max(-90, Math.min(90, latDeg));
  const y = Math.min(
    atlas.height - 1,
    Math.max(0, Math.floor(((90 - clampedLat) / 180) * atlas.height))
  );
  return atlas.grid[y * atlas.width + x] as ContinentId;
}
