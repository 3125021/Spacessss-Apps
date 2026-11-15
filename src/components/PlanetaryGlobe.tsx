import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { EpochData, FieldSite } from '../data/earthData';
import {
  LiveEonetEvent,
  LiveSarGranule,
  SAR_PHENOMENON_COLORS,
  SarObservationSite,
  SarPhenomenon,
} from '../data/sarData';
import { RotateCcw, Compass, Layers, Play, Pause, Maximize2, Radar, Loader2 } from 'lucide-react';

export interface GlobeLayerState {
  atmosphere: boolean;
  graticule: boolean;
  tectonics: boolean;
  thermal: boolean;
  beacons: boolean;
}

interface PlanetaryGlobeProps {
  epoch: EpochData;
  interpolatedVisuals: EpochData['visuals'];
  interpolatedAgeGa: number;
  interpolatedTempC: number;
  layers: GlobeLayerState;
  onToggleLayer: (key: keyof GlobeLayerState) => void;
  selectedSite: FieldSite | null;
  onSelectSite: (site: FieldSite | null) => void;
  compact?: boolean;
  explorationMode?: 'geological' | 'satellite';
  sarSites?: SarObservationSite[];
  selectedSarSite?: SarObservationSite | null;
  onSelectSarSite?: (site: SarObservationSite | null) => void;
  liveGranules?: LiveSarGranule[];
  selectedGranule?: LiveSarGranule | null;
  onSelectGranule?: (granule: LiveSarGranule | null) => void;
  eonetEvents?: LiveEonetEvent[];
  activeSarPhenomena?: Record<SarPhenomenon, boolean>;
  showLiveSwaths?: boolean;
  onScanRegion?: (lat: number, lon: number) => void;
  isScanningRegion?: boolean;
  focusTarget?: { lat: number; lon: number; nonce: number } | null;
}

// Fast deterministic 3D value noise for planetary crust/clouds
function hash3(x: number, y: number, z: number): number {
  let n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function noise3(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  const n000 = hash3(ix, iy, iz);
  const n100 = hash3(ix + 1, iy, iz);
  const n010 = hash3(ix, iy + 1, iz);
  const n110 = hash3(ix + 1, iy + 1, iz);
  const n001 = hash3(ix, iy, iz + 1);
  const n101 = hash3(ix + 1, iy, iz + 1);
  const n011 = hash3(ix, iy + 1, iz + 1);
  const n111 = hash3(ix + 1, iy + 1, iz + 1);

  const nx00 = n000 + (n100 - n000) * ux;
  const nx10 = n010 + (n110 - n010) * ux;
  const nx01 = n001 + (n101 - n001) * ux;
  const nx11 = n011 + (n111 - n011) * ux;

  const nxy0 = nx00 + (nx10 - nx00) * uy;
  const nxy1 = nx01 + (nx11 - nx01) * uy;

  return nxy0 + (nxy1 - nxy0) * uz;
}

function fbm3(x: number, y: number, z: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise3(x * freq, y * freq, z * freq);
    freq *= 2.05;
    amp *= 0.5;
  }
  return val;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

export const PlanetaryGlobe: React.FC<PlanetaryGlobeProps> = ({
  epoch,
  interpolatedVisuals,
  interpolatedAgeGa,
  interpolatedTempC,
  layers,
  onToggleLayer,
  selectedSite,
  onSelectSite,
  compact = false,
  explorationMode = 'geological',
  sarSites = [],
  selectedSarSite = null,
  onSelectSarSite,
  liveGranules = [],
  selectedGranule = null,
  onSelectGranule,
  eonetEvents = [],
  activeSarPhenomena,
  showLiveSwaths = true,
  onScanRegion,
  isScanningRegion = false,
  focusTarget = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [rotation, setRotation] = useState<{ lon: number; lat: number }>({
    lon: -0.45,
    lat: 0.22,
  });
  const [autoSpin, setAutoSpin] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lon: number } | null>(null);

  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });

  const rotationRef = useRef(rotation);
  rotationRef.current = rotation;

  // Auto-spin loop
  useEffect(() => {
    if (!autoSpin) return;
    let rafId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      if (!dragRef.current.active) {
        setRotation((prev) => ({
          ...prev,
          lon: prev.lon + dt * 0.14,
        }));
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [autoSpin]);

  // Center globe on selected geological field site
  useEffect(() => {
    if (!selectedSite) return;
    const targetLon = (selectedSite.lon * Math.PI) / 180;
    const targetLat = (selectedSite.lat * Math.PI) / 180;
    setRotation({ lon: targetLon, lat: targetLat * 0.72 });
  }, [selectedSite]);

  // Center globe when focusing on a satellite observation or EONET/granule target
  useEffect(() => {
    if (!focusTarget) return;
    const targetLon = (focusTarget.lon * Math.PI) / 180;
    const targetLat = (focusTarget.lat * Math.PI) / 180;
    setRotation({ lon: targetLon, lat: targetLat * 0.72 });
    setAutoSpin(false);
  }, [focusTarget]);

  // Render high-precision planetary sphere on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const size = Math.max(220, Math.floor(Math.min(rect.width || 540, rect.height || 540)));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Offscreen buffer for smooth procedural planetary sphere
    const renderRes = compact ? 180 : 250;
    if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * (compact ? 0.38 : 0.36) * zoom;

    const atmoRgb = hexToRgb(interpolatedVisuals.atmosphereHex);
    const oceanRgb = hexToRgb(interpolatedVisuals.oceanHex);
    const deepOceanRgb = hexToRgb(interpolatedVisuals.deepOceanHex);
    const landRgb = hexToRgb(interpolatedVisuals.landHex);
    const highlandRgb = hexToRgb(interpolatedVisuals.highlandHex);
    const iceRgb = hexToRgb(interpolatedVisuals.iceColorHex);

    // 1. Atmospheric outer glow
    if (layers.atmosphere) {
      const glowRadius = radius * 1.24;
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.88, cx, cy, glowRadius);
      grad.addColorStop(
        0,
        `rgba(${atmoRgb[0]}, ${atmoRgb[1]}, ${atmoRgb[2]}, ${0.32 * interpolatedVisuals.atmosphereIntensity})`
      );
      grad.addColorStop(
        0.55,
        `rgba(${atmoRgb[0]}, ${atmoRgb[1]}, ${atmoRgb[2]}, ${0.11 * interpolatedVisuals.atmosphereIntensity})`
      );
      grad.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Orbital coordinate ring around planet
    if (!compact) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.17, 0, Math.PI * 2);
      ctx.stroke();

      // Compass ticks at 0, 90, 180, 270
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.38)';
      for (let i = 0; i < 12; i++) {
        const ang = (i * Math.PI) / 6;
        const r1 = radius * 1.15;
        const r2 = i % 3 === 0 ? radius * 1.22 : radius * 1.185;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
        ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Render procedural 3D textured sphere to an offscreen canvas
    const off = document.createElement('canvas');
    off.width = renderRes;
    off.height = renderRes;
    const octx = off.getContext('2d');
    if (octx) {
      const img = octx.createImageData(renderRes, renderRes);
      const data = img.data;
      const half = renderRes / 2;
      const rOff = half - 1;

      const cosLon = Math.cos(rotation.lon);
      const sinLon = Math.sin(rotation.lon);
      const cosLat = Math.cos(rotation.lat);
      const sinLat = Math.sin(rotation.lat);

      // Sun light direction (top-left front)
      const lx = -0.58;
      const ly = -0.42;
      const lz = 0.7;

      const spread = interpolatedVisuals.continentSpread;
      const magma = interpolatedVisuals.magmaGlow;
      const iceCov = interpolatedVisuals.iceCoverage;
      const cloudCov = interpolatedVisuals.cloudCoverage;

      for (let py = 0; py < renderRes; py++) {
        const ny = (py - half) / rOff;
        const ny2 = ny * ny;
        for (let px = 0; px < renderRes; px++) {
          const nx = (px - half) / rOff;
          const d2 = nx * nx + ny2;
          if (d2 > 1) continue;

          const nz = Math.sqrt(1 - d2);

          // Rotate sphere point into world coordinates
          // Tilt around X (latitude)
          const y1 = ny * cosLat - nz * sinLat;
          const z1 = ny * sinLat + nz * cosLat;
          const x1 = nx;

          // Spin around Y (longitude)
          const wx = x1 * cosLon + z1 * sinLon;
          const wy = y1;
          const wz = -x1 * sinLon + z1 * cosLon;

          // Continent mask: blend between Pangaea cluster (spread < 0) and dispersed cratons
          const scale = spread < 0 ? 1.55 : 2.15;
          let elevation = fbm3(wx * scale + 3.1, wy * scale + 1.7, wz * scale + 5.2, 4);

          if (spread < 0) {
            // Pull continents into a supercontinent hemisphere around wx > -0.1
            const pangaeaBias = (wx * 0.45 + wz * 0.25) * Math.abs(spread) * 0.42;
            elevation += pangaeaBias;
          } else if (spread < 0.35) {
            // Early Archean / Hadean smaller proto-crust
            elevation -= (0.35 - spread) * 0.32;
          }

          const seaThreshold = 0.51;
          let rgb: [number, number, number];

          if (elevation > seaThreshold) {
            const landH = Math.min(1, (elevation - seaThreshold) / 0.28);
            rgb = mixRgb(landRgb, highlandRgb, landH);

            // Magma fissures on Hadean crust
            if (magma > 0.05) {
              const crack = fbm3(wx * 7.5 + 11, wy * 7.5, wz * 7.5, 2);
              if (crack > 0.62 - magma * 0.14) {
                const intensity = Math.min(1, ((crack - 0.52) * 4) * magma);
                rgb = mixRgb(rgb, [255, 118, 28], intensity);
              }
            }
          } else {
            const depth = Math.min(1, (seaThreshold - elevation) / 0.25);
            rgb = mixRgb(oceanRgb, deepOceanRgb, depth);

            // Hadean lava ocean glow
            if (magma > 0.25) {
              const lavaSwirl = fbm3(wx * 5.2, wy * 5.2 + 4, wz * 5.2, 3);
              if (lavaSwirl > 0.55) {
                rgb = mixRgb(rgb, [245, 130, 32], (lavaSwirl - 0.5) * 1.5 * magma);
              }
            }
          }

          // Polar & Snowball glaciation
          const absLat = Math.abs(wy);
          const iceThreshold = 1.0 - iceCov * 1.04;
          const iceNoise = (fbm3(wx * 6, wy * 6, wz * 6, 2) - 0.5) * 0.12;
          if (absLat + iceNoise > iceThreshold && iceCov > 0.01) {
            const iceBlend = Math.min(1, (absLat + iceNoise - iceThreshold) * 6.5);
            rgb = mixRgb(rgb, iceRgb, iceBlend);
          }

          // Thermal gradient overlay if toggled
          if (layers.thermal) {
            const equatorHeat = 1 - absLat * 0.7;
            const thermalColor: [number, number, number] =
              interpolatedTempC > 35
                ? [245, 100, 30]
                : interpolatedTempC < 0
                ? [56, 189, 248]
                : [16, 185, 129];
            rgb = mixRgb(rgb, thermalColor, 0.38 * equatorHeat);
          }

          // Cloud layer
          if (cloudCov > 0.05) {
            const cVal = fbm3(wx * 3.4 + 9.2, wy * 4.8 - 2.1, wz * 3.4, 3);
            const cThresh = 0.66 - cloudCov * 0.24;
            if (cVal > cThresh) {
              const alpha = Math.min(0.75, (cVal - cThresh) * 2.8 * cloudCov);
              rgb = mixRgb(rgb, [235, 244, 255], alpha);
            }
          }

          // Diffuse lighting + Fresnel atmospheric limb
          const ndotl = Math.max(0.08, nx * lx + ny * ly + nz * lz);
          const fresnel = Math.pow(1 - nz, 3.1);
          const lit: [number, number, number] = [
            rgb[0] * (0.14 + 0.94 * ndotl),
            rgb[1] * (0.16 + 0.94 * ndotl),
            rgb[2] * (0.22 + 0.94 * ndotl),
          ];

          const finalRgb = layers.atmosphere
            ? mixRgb(lit, atmoRgb, fresnel * 0.78 * interpolatedVisuals.atmosphereIntensity)
            : lit;

          const idx = (py * renderRes + px) * 4;
          data[idx] = Math.min(255, Math.max(0, finalRgb[0]));
          data[idx + 1] = Math.min(255, Math.max(0, finalRgb[1]));
          data[idx + 2] = Math.min(255, Math.max(0, finalRgb[2]));
          data[idx + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
    }

    // Draw planet sphere cleanly clipped
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(off, cx - radius, cy - radius, radius * 2, radius * 2);

    // 4. Graticule (lat/lon lines)
    if (layers.graticule) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 0.85;
      const cosLon = Math.cos(rotation.lon);
      const sinLon = Math.sin(rotation.lon);
      const cosLat = Math.cos(rotation.lat);
      const sinLat = Math.sin(rotation.lat);

      // Parallels
      for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
        const phi = (latDeg * Math.PI) / 180;
        const cp = Math.cos(phi);
        const sp = Math.sin(phi);
        ctx.beginPath();
        let started = false;
        for (let lonDeg = -180; lonDeg <= 180; lonDeg += 6) {
          const lam = (lonDeg * Math.PI) / 180;
          const wx = cp * Math.sin(lam);
          const wy = -sp;
          const wz = cp * Math.cos(lam);

          const x1 = wx * cosLon - wz * sinLon;
          const z1 = wx * sinLon + wz * cosLon;
          const y2 = wy * cosLat + z1 * sinLat;
          const z2 = -wy * sinLat + z1 * cosLat;

          if (z2 > 0) {
            const sx = cx + x1 * radius;
            const sy = cy + y2 * radius;
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // Meridians
      for (let lonDeg = -180; lonDeg < 180; lonDeg += 30) {
        const lam = (lonDeg * Math.PI) / 180;
        ctx.beginPath();
        let started = false;
        for (let latDeg = -84; latDeg <= 84; latDeg += 6) {
          const phi = (latDeg * Math.PI) / 180;
          const cp = Math.cos(phi);
          const sp = Math.sin(phi);
          const wx = cp * Math.sin(lam);
          const wy = -sp;
          const wz = cp * Math.cos(lam);

          const x1 = wx * cosLon - wz * sinLon;
          const z1 = wx * sinLon + wz * cosLon;
          const y2 = wy * cosLat + z1 * sinLat;
          const z2 = -wy * sinLat + z1 * cosLat;

          if (z2 > 0) {
            const sx = cx + x1 * radius;
            const sy = cy + y2 * radius;
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }
    }

    // 5. Tectonic plate arcs overlay
    if (layers.tectonics) {
      const cosLon = Math.cos(rotation.lon);
      const sinLon = Math.sin(rotation.lon);
      const cosLat = Math.cos(rotation.lat);
      const sinLat = Math.sin(rotation.lat);

      const plateArcs: Array<Array<[number, number]>> = [
        [
          [-55, -70],
          [-20, -72],
          [10, -82],
          [38, -122],
          [56, -158],
          [42, 145],
          [15, 126],
        ],
        [
          [64, -20],
          [35, -35],
          [0, -18],
          [-35, -15],
          [-52, 5],
        ],
        [
          [36, -5],
          [38, 28],
          [28, 78],
          [15, 98],
          [-6, 115],
        ],
      ];

      ctx.strokeStyle =
        interpolatedVisuals.magmaGlow > 0.3
          ? 'rgba(245, 158, 11, 0.85)'
          : 'rgba(0, 240, 255, 0.72)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);

      for (const arc of plateArcs) {
        ctx.beginPath();
        let started = false;
        for (const [latD, lonD] of arc) {
          const phi = (latD * Math.PI) / 180;
          const lam = (lonD * Math.PI) / 180;
          const wx = Math.cos(phi) * Math.sin(lam);
          const wy = -Math.sin(phi);
          const wz = Math.cos(phi) * Math.cos(lam);

          const x1 = wx * cosLon - wz * sinLon;
          const z1 = wx * sinLon + wz * cosLon;
          const y2 = wy * cosLat + z1 * sinLat;
          const z2 = -wy * sinLat + z1 * cosLat;

          if (z2 > 0.02) {
            const sx = cx + x1 * radius;
            const sy = cy + y2 * radius;
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // 6. Satellite Observation Mode: GeoJSON Swath Footprints on 3D Sphere
    if (!compact && explorationMode === 'satellite') {
      const cosLon = Math.cos(rotation.lon);
      const sinLon = Math.sin(rotation.lon);
      const cosLat = Math.cos(rotation.lat);
      const sinLat = Math.sin(rotation.lat);

      const drawGeoPolygon = (
        ring: Array<[number, number]>,
        strokeStyle: string,
        fillStyle: string,
        lineWidth: number
      ) => {
        if (ring.length < 3) return;
        const pts: Array<{ sx: number; sy: number; z: number }> = [];
        for (const [latD, lonD] of ring) {
          const phi = (latD * Math.PI) / 180;
          const lam = (lonD * Math.PI) / 180;
          const wx = Math.cos(phi) * Math.sin(lam);
          const wy = -Math.sin(phi);
          const wz = Math.cos(phi) * Math.cos(lam);

          const x1 = wx * cosLon - wz * sinLon;
          const z1 = wx * sinLon + wz * cosLon;
          const y2 = wy * cosLat + z1 * sinLat;
          const z2 = -wy * sinLat + z1 * cosLat;
          pts.push({ sx: cx + x1 * radius, sy: cy + y2 * radius, z: z2 });
        }

        const visibleCount = pts.filter((p) => p.z > 0.02).length;
        if (visibleCount < 2) return;

        ctx.save();
        ctx.beginPath();
        let started = false;
        for (const p of pts) {
          if (p.z > -0.05) {
            if (!started) {
              ctx.moveTo(p.sx, p.sy);
              started = true;
            } else {
              ctx.lineTo(p.sx, p.sy);
            }
          }
        }
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        ctx.restore();
      };

      // Curated SAR study swaths
      for (const site of sarSites) {
        if (activeSarPhenomena && !activeSarPhenomena[site.phenomenon]) continue;
        const hex = SAR_PHENOMENON_COLORS[site.phenomenon];
        const isSel = selectedSarSite?.id === site.id;
        drawGeoPolygon(
          site.footprintPolygon,
          isSel ? '#ffffff' : hex,
          isSel ? `${hex}44` : `${hex}22`,
          isSel ? 2.1 : 1.35
        );
      }

      // Live ASF / NASA CMR GeoJSON granule swaths
      if (showLiveSwaths) {
        for (const gran of liveGranules) {
          if (!gran.polygon || gran.polygon.length < 3) continue;
          const isSel = selectedGranule?.id === gran.id;
          drawGeoPolygon(
            gran.polygon,
            isSel ? '#00f0ff' : 'rgba(123, 208, 255, 0.72)',
            isSel ? 'rgba(0, 240, 255, 0.25)' : 'rgba(56, 189, 248, 0.09)',
            isSel ? 2 : 1.05
          );
        }
      }
    }

    ctx.restore();

    // Crisp rim outline
    ctx.strokeStyle = `rgba(${atmoRgb[0]}, ${atmoRgb[1]}, ${atmoRgb[2]}, 0.42)`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }, [
    epoch,
    interpolatedVisuals,
    interpolatedTempC,
    rotation,
    zoom,
    layers,
    compact,
    explorationMode,
    sarSites,
    selectedSarSite,
    liveGranules,
    selectedGranule,
    activeSarPhenomena,
    showLiveSwaths,
  ]);

  // Compute current globe center (LAT, LON) for zoom-aware regional queries
  const centerCoords = useMemo(() => {
    const cosLon = Math.cos(rotation.lon);
    const sinLon = Math.sin(rotation.lon);
    const cosLat = Math.cos(rotation.lat);
    const sinLat = Math.sin(rotation.lat);
    const wy = -sinLat;
    const wx = cosLat * sinLon;
    const wz = cosLat * cosLon;
    return {
      lat: -(Math.asin(Math.max(-1, Math.min(1, wy))) * 180) / Math.PI,
      lon: (Math.atan2(wx, wz) * 180) / Math.PI,
    };
  }, [rotation.lon, rotation.lat]);

  // Project either Geological Field Sites or Satellite SAR Beacons + EONET Events
  const projectLatLon = useCallback(
    (latDeg: number, lonDeg: number) => {
      const cosLon = Math.cos(rotation.lon);
      const sinLon = Math.sin(rotation.lon);
      const cosLat = Math.cos(rotation.lat);
      const sinLat = Math.sin(rotation.lat);
      const rNorm = (compact ? 0.38 : 0.36) * zoom;

      const phi = (latDeg * Math.PI) / 180;
      const lam = (lonDeg * Math.PI) / 180;
      const wx = Math.cos(phi) * Math.sin(lam);
      const wy = -Math.sin(phi);
      const wz = Math.cos(phi) * Math.cos(lam);

      const x1 = wx * cosLon - wz * sinLon;
      const z1 = wx * sinLon + wz * cosLon;
      const y2 = wy * cosLat + z1 * sinLat;
      const z2 = -wy * sinLat + z1 * cosLat;

      return {
        leftPct: (0.5 + x1 * rNorm) * 100,
        topPct: (0.5 + y2 * rNorm) * 100,
        visible: z2 > 0.12,
      };
    },
    [rotation.lon, rotation.lat, zoom, compact]
  );

  const projectedPins = useMemo(() => {
    return epoch.fieldSites.map((site) => ({
      site,
      ...projectLatLon(site.lat, site.lon),
    }));
  }, [epoch.fieldSites, projectLatLon]);

  const projectedSarPins = useMemo(() => {
    if (explorationMode !== 'satellite') return [];
    return sarSites
      .filter((s) => !activeSarPhenomena || activeSarPhenomena[s.phenomenon])
      .map((site) => ({
        site,
        ...projectLatLon(site.lat, site.lon),
      }));
  }, [explorationMode, sarSites, activeSarPhenomena, projectLatLon]);

  const projectedEonetPins = useMemo(() => {
    if (explorationMode !== 'satellite' || !showLiveSwaths) return [];
    return eonetEvents.slice(0, 12).map((ev) => ({
      event: ev,
      ...projectLatLon(ev.lat, ev.lon),
    }));
  }, [explorationMode, showLiveSwaths, eonetEvents, projectLatLon]);

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragRef.current.active) {
        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        setRotation((prev) => ({
          lon: prev.lon + dx * 0.0085,
          lat: Math.max(-1.15, Math.min(1.15, prev.lat + dy * 0.0085)),
        }));
      }

      // Calculate surface lat/lon under pointer for crosshair telemetry
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const radius = size * (compact ? 0.38 : 0.36) * zoom;
      const mx = e.clientX - cx;
      const my = e.clientY - cy;
      const nx = mx / radius;
      const ny = my / radius;
      const d2 = nx * nx + ny * ny;

      if (d2 <= 1) {
        const nz = Math.sqrt(1 - d2);
        const cosLon = Math.cos(rotationRef.current.lon);
        const sinLon = Math.sin(rotationRef.current.lon);
        const cosLat = Math.cos(rotationRef.current.lat);
        const sinLat = Math.sin(rotationRef.current.lat);

        const y1 = ny * cosLat - nz * sinLat;
        const z1 = ny * sinLat + nz * cosLat;
        const x1 = nx;
        const wx = x1 * cosLon + z1 * sinLon;
        const wy = y1;
        const wz = -x1 * sinLon + z1 * cosLon;

        const latDeg = -(Math.asin(Math.max(-1, Math.min(1, wy))) * 180) / Math.PI;
        const lonDeg = (Math.atan2(wx, wz) * 180) / Math.PI;
        setHoverCoords({ lat: latDeg, lon: lonDeg });
      } else {
        setHoverCoords(null);
      }
    },
    [compact, zoom]
  );

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore if not captured
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        dragRef.current.active = false;
        setHoverCoords(null);
      }}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none ${
        hoverCoords ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Subtle orbital background rings */}
      {!compact && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="w-[82%] max-w-[660px] aspect-square rounded-full border border-[#38bdf8]/10" />
          <div className="absolute w-[98%] max-w-[820px] aspect-square rounded-full border border-[#38bdf8]/5" />
        </div>
      )}

      {/* Centered Square Canvas + Pin Wrapper */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: compact ? 240 : 'min(90%, 520px)', aspectRatio: '1 / 1' }}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />

        {/* 3D Field Site Pins Overlay (Geological Time) */}
        {!compact && explorationMode === 'geological' && layers.beacons && (
          <div className="pointer-events-none absolute inset-0">
            {projectedPins.map(({ site, leftPct, topPct, visible }) => {
              if (!visible) return null;
              const isSelected = selectedSite?.id === site.id;

              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSite(isSelected ? null : site);
                  }}
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                  className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] rounded px-1.5 py-1 transition-transform duration-150 ${
                    isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                  }`}
                  title={`${site.name} (${site.ageLabel})`}
                >
                  <span
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono-tabular tracking-wider uppercase border backdrop-blur-md whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#00f0ff] text-[#030712] border-[#00f0ff] font-semibold shadow-[0_0_16px_rgba(0,240,255,0.55)]'
                        : 'bg-[#0a122a]/85 text-[#dbe1ff] border-[#38bdf8]/45 hover:border-[#00f0ff]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? 'bg-[#030712]'
                          : site.category === 'Extinction'
                          ? 'bg-[#f59e0b]'
                          : 'bg-[#00f0ff]'
                      }`}
                    />
                    {site.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 3D SAR Observation Pins & Live NASA EONET Hazard Markers (Satellite Mode) */}
        {!compact && explorationMode === 'satellite' && layers.beacons && (
          <div className="pointer-events-none absolute inset-0">
            {projectedEonetPins.map(({ event, leftPct, topPct, visible }) => {
              if (!visible) return null;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onScanRegion) onScanRegion(event.lat, event.lon);
                  }}
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 z-10 group focus-visible:outline-none"
                  title={`NASA EONET: ${event.title} (${event.category}) — Click to query ASF SAR granules`}
                >
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono-tabular tracking-wider bg-[#030712]/80 border border-[#f59e0b]/60 text-[#ffd19c] hover:border-[#00f0ff] whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                    <span>{event.category.split(' ')[0]}</span>
                  </span>
                </button>
              );
            })}

            {projectedSarPins.map(({ site, leftPct, topPct, visible }) => {
              if (!visible) return null;
              const isSelected = selectedSarSite?.id === site.id;
              const color = SAR_PHENOMENON_COLORS[site.phenomenon];
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectSarSite) onSelectSarSite(isSelected ? null : site);
                  }}
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                  className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] rounded transition-transform duration-150 ${
                    isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-15'
                  }`}
                  title={`${site.mission}: ${site.title}`}
                >
                  <span
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono-tabular tracking-wider uppercase border backdrop-blur-md whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#00f0ff] text-[#030712] border-[#00f0ff] font-semibold shadow-[0_0_16px_rgba(0,240,255,0.55)]'
                        : 'bg-[#0a122a]/90 text-[#dbe1ff] border-[#38bdf8]/55 hover:border-[#00f0ff]'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: isSelected ? '#030712' : color }}
                    />
                    {site.mission} · {site.phenomenon}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Top-Left Live Coordinate HUD */}
      {!compact && (
        <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="font-mono-tabular text-[11px] uppercase tracking-[0.08em] text-[#7bd0ff]">
              {explorationMode === 'satellite'
                ? `Orbital SAR Projection · Center ${Math.abs(centerCoords.lat).toFixed(1)}°${
                    centerCoords.lat >= 0 ? 'N' : 'S'
                  } ${Math.abs(centerCoords.lon).toFixed(1)}°${centerCoords.lon >= 0 ? 'E' : 'W'}`
                : `Orbital Projection · ${interpolatedAgeGa.toFixed(3)} Ga`}
            </div>
            <div className="font-mono-tabular text-xs text-[#dbe1ff]/90">
              {hoverCoords
                ? `LAT ${Math.abs(hoverCoords.lat).toFixed(1)}° ${
                    hoverCoords.lat >= 0 ? 'N' : 'S'
                  }  ·  LON ${Math.abs(hoverCoords.lon).toFixed(1)}° ${
                    hoverCoords.lon >= 0 ? 'E' : 'W'
                  }`
                : explorationMode === 'satellite'
                ? 'Drag or zoom into any region to scan live NASA/ASF SAR swaths'
                : 'Drag sphere to rotate · Click site markers to inspect'}
            </div>
          </div>

          {explorationMode === 'satellite' && onScanRegion && (
            <button
              type="button"
              disabled={isScanningRegion}
              onClick={() => onScanRegion(centerCoords.lat, centerCoords.lon)}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono-tabular uppercase tracking-wider bg-[#00f0ff]/15 border border-[#00f0ff]/80 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#030712] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {isScanningRegion ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Radar className="w-3.5 h-3.5" />
              )}
              <span>{isScanningRegion ? 'Scanning ASF/CMR...' : 'Scan Viewport Region'}</span>
            </button>
          )}
        </div>
      )}

      {/* Bottom Viewport Controls HUD */}
      {!compact && (
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 observatory-deck rounded px-2 py-1.5">
            {(
              [
                ['atmosphere', 'Atmosphere'],
                ['graticule', 'Grid'],
                ['tectonics', 'Plates'],
                ['thermal', 'Thermal'],
                ['beacons', 'Sites'],
              ] as Array<[keyof GlobeLayerState, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => onToggleLayer(key)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono-tabular uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 min-h-[32px] ${
                  layers[key]
                    ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/60'
                    : 'text-[#b9cacb] border border-transparent hover:text-[#dbe1ff] hover:bg-[#212942]/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5 observatory-deck rounded px-2 py-1.5">
            <button
              type="button"
              onClick={() => setAutoSpin((s) => !s)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono-tabular uppercase tracking-wider text-[#dbe1ff] hover:text-[#00f0ff] hover:bg-[#212942]/60 transition-colors min-h-[32px] whitespace-nowrap"
              title={autoSpin ? 'Pause Rotation' : 'Resume Rotation'}
            >
              {autoSpin ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{autoSpin ? 'Spin' : 'Paused'}</span>
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => (z > 1.15 ? 0.92 : z + 0.12))}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono-tabular uppercase text-[#b9cacb] hover:text-[#00f0ff] hover:bg-[#212942]/60 transition-colors min-h-[32px]"
              title="Cycle Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{Math.round(zoom * 100)}%</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRotation({ lon: -0.45, lat: 0.22 });
                setZoom(1);
                onSelectSite(null);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono-tabular uppercase text-[#b9cacb] hover:text-[#00f0ff] hover:bg-[#212942]/60 transition-colors min-h-[32px]"
              title="Reset Orientation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Unused icon suppressions handled cleanly */}
      <span className="sr-only">
        <Compass />
        <Layers />
      </span>
    </div>
  );
};
