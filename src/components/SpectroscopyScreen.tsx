import React, { useState } from 'react';
import {
  SPECTROSCOPY_SERIES,
  MASS_EXTINCTIONS,
  EARTH_EPOCHS,
  SpectroscopyPoint,
} from '../data/earthData';
import { Globe } from 'lucide-react';

interface SpectroscopyScreenProps {
  onJumpToEpochId: (epochId: string) => void;
}

export const SpectroscopyScreen: React.FC<SpectroscopyScreenProps> = ({
  onJumpToEpochId,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<SpectroscopyPoint | null>(
    SPECTROSCOPY_SERIES[14] // Carboniferous peak default highlight
  );
  const [selectedExtinctionId, setSelectedExtinctionId] = useState<string>(
    MASS_EXTINCTIONS[2].id // End-Permian Great Dying
  );

  const selectedExtinction =
    MASS_EXTINCTIONS.find((m) => m.id === selectedExtinctionId) || MASS_EXTINCTIONS[0];

  // SVG Chart Geometry (880 x 260)
  const W = 880;
  const H = 260;
  const PAD_L = 58;
  const PAD_R = 54;
  const PAD_T = 24;
  const PAD_B = 38;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  // Map 4.50 Ga (left) -> 0.00 Ga (right)
  const xForAge = (ageGa: number) => PAD_L + ((4.5 - ageGa) / 4.5) * plotW;

  // Chart 1: O2 (0..35%) & log10 CO2 (2..6)
  const yForO2 = (o2: number) => PAD_T + plotH - (Math.min(35, o2) / 35) * plotH;
  const yForLogCo2 = (co2: number) => {
    const logVal = Math.log10(Math.max(100, co2)); // 2.0 to 6.0
    const norm = Math.max(0, Math.min(1, (logVal - 2) / 4));
    return PAD_T + plotH - norm * plotH;
  };

  // Chart 2: Temp (-60..240 C compressed non-linear or clamped nicely) & Solar (68..102%)
  const yForTemp = (tempC: number) => {
    // Symlog-like visual scaling so both -44°C and +230°C are clearly readable
    const norm = Math.max(0, Math.min(1, (tempC + 60) / 300));
    return PAD_T + plotH - norm * plotH;
  };
  const yForSolar = (solarPct: number) => {
    const norm = Math.max(0, Math.min(1, (solarPct - 68) / 34));
    return PAD_T + plotH - norm * plotH;
  };

  const o2Path = SPECTROSCOPY_SERIES.map(
    (p, i) => `${i === 0 ? 'M' : 'L'} ${xForAge(p.ageGa).toFixed(1)} ${yForO2(p.o2Pct).toFixed(1)}`
  ).join(' ');

  const o2Area = `${o2Path} L ${xForAge(0).toFixed(1)} ${(PAD_T + plotH).toFixed(1)} L ${xForAge(
    4.5
  ).toFixed(1)} ${(PAD_T + plotH).toFixed(1)} Z`;

  const co2Path = SPECTROSCOPY_SERIES.map(
    (p, i) => `${i === 0 ? 'M' : 'L'} ${xForAge(p.ageGa).toFixed(1)} ${yForLogCo2(p.co2Ppm).toFixed(1)}`
  ).join(' ');

  const tempPath = SPECTROSCOPY_SERIES.map(
    (p, i) => `${i === 0 ? 'M' : 'L'} ${xForAge(p.ageGa).toFixed(1)} ${yForTemp(p.tempC).toFixed(1)}`
  ).join(' ');

  const solarPath = SPECTROSCOPY_SERIES.map(
    (p, i) => `${i === 0 ? 'M' : 'L'} ${xForAge(p.ageGa).toFixed(1)} ${yForSolar(p.solarPct).toFixed(1)}`
  ).join(' ');

  const activePoint = hoveredPoint || SPECTROSCOPY_SERIES[SPECTROSCOPY_SERIES.length - 1];
  const matchedEpoch = EARTH_EPOCHS.find((e) => e.id === activePoint.epochId) || EARTH_EPOCHS[0];

  return (
    <div className="max-w-[1680px] mx-auto px-5 md:px-10 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#38bdf8]/20 pb-6">
        <div>
          <div className="font-mono-tabular text-xs uppercase tracking-[0.12em] text-[#7bd0ff]">
            Paleoatmospheric & Radiative Spectroscopy
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#dbfcff] mt-1 tracking-tight text-balance">
            4.54 Billion Years of Atmospheric Evolution
          </h1>
          <p className="text-sm text-[#b9cacb] mt-2 max-w-2xl">
            Interactive geochemical proxy curves tracking the rise of molecular oxygen, greenhouse carbon drawdown, solar brightening, and Phanerozoic biotic crises. Hover any node to inspect coordinates or click to jump into the 3D globe.
          </p>
        </div>

        {/* Synchronized Crosshair Readout Box */}
        <div className="observatory-deck rounded-lg px-4 py-3 flex items-center gap-5 shrink-0">
          <div className="font-mono-tabular">
            <div className="text-[10px] uppercase tracking-wider text-[#7bd0ff]">Selected Horizon</div>
            <div className="text-base font-semibold text-[#00f0ff]">{activePoint.label}</div>
          </div>
          <div className="font-mono-tabular border-l border-[#38bdf8]/20 pl-4">
            <div className="text-[10px] uppercase tracking-wider text-[#849495]">O₂ / CO₂</div>
            <div className="text-sm text-[#dbe1ff]">
              {activePoint.o2Pct.toFixed(2)}% ·{' '}
              <span className="text-[#f59e0b]">
                {activePoint.co2Ppm >= 10000
                  ? `${(activePoint.co2Ppm / 10000).toFixed(1)}%`
                  : `${activePoint.co2Ppm.toLocaleString()} ppm`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onJumpToEpochId(matchedEpoch.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-tabular uppercase tracking-wider bg-[#00f0ff]/15 border border-[#00f0ff]/70 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#030712] transition-colors whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Open Epoch</span>
          </button>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart 1: Atmospheric O2 vs log CO2 */}
        <section className="observatory-deck reticle-frame rounded-lg p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#7bd0ff]">
                Chart 01 · Gas Partial Pressures
              </div>
              <h2 className="font-display text-lg font-semibold text-[#dbfcff]">
                Atmospheric O₂ (%) vs. CO₂ (log₁₀ ppm)
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono-tabular">
              <span className="flex items-center gap-1.5 text-[#00f0ff]">
                <span className="w-3 h-0.5 bg-[#00f0ff] inline-block" /> O₂ (%)
              </span>
              <span className="flex items-center gap-1.5 text-[#f59e0b]">
                <span className="w-3 h-0.5 bg-[#f59e0b] border-t border-dashed border-[#f59e0b] inline-block" /> CO₂ (log)
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px] h-auto select-none">
              <defs>
                <linearGradient id="o2Fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              {[0, 10, 20, 30].map((val) => {
                const y = yForO2(val);
                return (
                  <g key={val}>
                    <line
                      x1={PAD_L}
                      y1={y}
                      x2={W - PAD_R}
                      y2={y}
                      stroke="rgba(56, 189, 248, 0.12)"
                      strokeDasharray="3 4"
                    />
                    <text
                      x={PAD_L - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[#7bd0ff] text-[10px] font-mono"
                    >
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* Great Oxidation & Snowball Shaded Markers */}
              <rect
                x={xForAge(2.45)}
                y={PAD_T}
                width={xForAge(2.1) - xForAge(2.45)}
                height={plotH}
                fill="rgba(56, 189, 248, 0.06)"
              />
              <text
                x={(xForAge(2.45) + xForAge(2.1)) / 2}
                y={PAD_T + 14}
                textAnchor="middle"
                className="fill-[#7bd0ff]/75 text-[9px] font-mono uppercase"
              >
                GOE
              </text>

              {/* Curves */}
              <path d={o2Area} fill="url(#o2Fill)" />
              <path d={o2Path} fill="none" stroke="#00f0ff" strokeWidth="2.2" />
              <path
                d={co2Path}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="5 4"
              />

              {/* Interactive Crosshair Vertical Line */}
              <line
                x1={xForAge(activePoint.ageGa)}
                y1={PAD_T}
                x2={xForAge(activePoint.ageGa)}
                y2={PAD_T + plotH}
                stroke="rgba(0, 240, 255, 0.45)"
                strokeWidth="1"
              />

              {/* Interactive Data Points */}
              {SPECTROSCOPY_SERIES.map((pt) => {
                const cx = xForAge(pt.ageGa);
                const cyO2 = yForO2(pt.o2Pct);
                const cyCo2 = yForLogCo2(pt.co2Ppm);
                const isActive = pt.ageGa === activePoint.ageGa;
                return (
                  <g
                    key={pt.ageGa}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onClick={() => onJumpToEpochId(pt.epochId)}
                  >
                    <rect
                      x={cx - 12}
                      y={PAD_T}
                      width={24}
                      height={plotH}
                      fill="transparent"
                    />
                    <circle
                      cx={cx}
                      cy={cyO2}
                      r={isActive ? 5 : 2.5}
                      fill={isActive ? '#00f0ff' : '#0a122a'}
                      stroke="#00f0ff"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={cx}
                      cy={cyCo2}
                      r={isActive ? 4.5 : 2.2}
                      fill={isActive ? '#f59e0b' : '#0a122a'}
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {/* X-Axis Ga Labels */}
              {[4.5, 3.5, 2.5, 1.5, 0.5, 0.0].map((ga) => (
                <text
                  key={ga}
                  x={xForAge(ga)}
                  y={H - 12}
                  textAnchor="middle"
                  className="fill-[#849495] text-[10px] font-mono"
                >
                  {ga.toFixed(1)} Ga
                </text>
              ))}
            </svg>
          </div>
        </section>

        {/* Chart 2: Mean Global Temperature & Solar Luminosity */}
        <section className="observatory-deck reticle-frame rounded-lg p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#7bd0ff]">
                Chart 02 · Thermal & Radiative Budget
              </div>
              <h2 className="font-display text-lg font-semibold text-[#dbfcff]">
                Surface Temperature (°C) & Solar Output (% L☉)
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono-tabular">
              <span className="flex items-center gap-1.5 text-[#38bdf8]">
                <span className="w-3 h-0.5 bg-[#38bdf8] inline-block" /> Temp (°C)
              </span>
              <span className="flex items-center gap-1.5 text-[#a78bfa]">
                <span className="w-3 h-0.5 bg-[#a78bfa] inline-block" /> Solar (% L☉)
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px] h-auto select-none">
              {/* 0 C Freezing Reference Line */}
              <line
                x1={PAD_L}
                y1={yForTemp(0)}
                x2={W - PAD_R}
                y2={yForTemp(0)}
                stroke="rgba(123, 208, 255, 0.35)"
                strokeDasharray="4 4"
              />
              <text
                x={PAD_L - 8}
                y={yForTemp(0) + 4}
                textAnchor="end"
                className="fill-[#7bd0ff] text-[10px] font-mono"
              >
                0°C
              </text>

              {[60, 120, 180].map((tVal) => (
                <g key={tVal}>
                  <line
                    x1={PAD_L}
                    y1={yForTemp(tVal)}
                    x2={W - PAD_R}
                    y2={yForTemp(tVal)}
                    stroke="rgba(56, 189, 248, 0.1)"
                  />
                  <text
                    x={PAD_L - 8}
                    y={yForTemp(tVal) + 4}
                    textAnchor="end"
                    className="fill-[#849495] text-[10px] font-mono"
                  >
                    {tVal}°C
                  </text>
                </g>
              ))}

              <path d={solarPath} fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeDasharray="4 3" />
              <path d={tempPath} fill="none" stroke="#38bdf8" strokeWidth="2.2" />

              <line
                x1={xForAge(activePoint.ageGa)}
                y1={PAD_T}
                x2={xForAge(activePoint.ageGa)}
                y2={PAD_T + plotH}
                stroke="rgba(0, 240, 255, 0.45)"
                strokeWidth="1"
              />

              {SPECTROSCOPY_SERIES.map((pt) => {
                const cx = xForAge(pt.ageGa);
                const cyT = yForTemp(pt.tempC);
                const cyS = yForSolar(pt.solarPct);
                const isActive = pt.ageGa === activePoint.ageGa;
                return (
                  <g
                    key={pt.ageGa}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onClick={() => onJumpToEpochId(pt.epochId)}
                  >
                    <rect x={cx - 12} y={PAD_T} width={24} height={plotH} fill="transparent" />
                    <circle
                      cx={cx}
                      cy={cyT}
                      r={isActive ? 5 : 2.5}
                      fill={isActive ? '#38bdf8' : '#0a122a'}
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={cx}
                      cy={cyS}
                      r={isActive ? 4.5 : 2}
                      fill={isActive ? '#a78bfa' : '#0a122a'}
                      stroke="#a78bfa"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {[4.5, 3.5, 2.5, 1.5, 0.5, 0.0].map((ga) => (
                <text
                  key={ga}
                  x={xForAge(ga)}
                  y={H - 12}
                  textAnchor="middle"
                  className="fill-[#849495] text-[10px] font-mono"
                >
                  {ga.toFixed(1)} Ga
                </text>
              ))}
            </svg>
          </div>
        </section>
      </div>

      {/* Bottom Section: Big Five Mass Extinction Intensity Gauge */}
      <section className="observatory-deck rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#38bdf8]/15 pb-4 mb-5">
          <div>
            <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#f59e0b]">
              Phanerozoic Biotic Crises · Marine Genera Loss
            </div>
            <h2 className="font-display text-xl font-semibold text-[#dbfcff] mt-0.5">
              The Five Major Mass Extinction Horizons
            </h2>
          </div>
          <span className="font-mono-tabular text-xs text-[#b9cacb]">
            Select any event column to inspect geochemical forcing
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Interactive Bar Spectrum */}
          <div className="lg:col-span-7 grid grid-cols-5 gap-3 items-end h-[220px] pt-6 pb-2 px-3 bg-[#050b14]/70 border border-[#38bdf8]/15 rounded-lg">
            {MASS_EXTINCTIONS.map((ev) => {
              const isSelected = ev.id === selectedExtinction.id;
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setSelectedExtinctionId(ev.id)}
                  className="flex flex-col items-center justify-end h-full gap-2 group focus-visible:outline-none"
                >
                  <span
                    className={`font-mono-tabular text-xs font-semibold ${
                      isSelected ? 'text-[#f59e0b]' : 'text-[#b9cacb] group-hover:text-[#dbfcff]'
                    }`}
                  >
                    -{ev.generaLostPct}%
                  </span>
                  <div className="w-full max-w-[54px] flex-1 flex items-end justify-center">
                    <div
                      className={`w-full rounded-t transition-all duration-200 border ${
                        isSelected
                          ? 'bg-[#f59e0b]/35 border-[#f59e0b] shadow-[0_0_16px_rgba(245,158,11,0.35)]'
                          : 'bg-[#38bdf8]/15 border-[#38bdf8]/35 group-hover:bg-[#38bdf8]/30'
                      }`}
                      style={{ height: `${ev.generaLostPct}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <div
                      className={`font-mono-tabular text-[10px] ${
                        isSelected ? 'text-[#00f0ff]' : 'text-[#849495]'
                      }`}
                    >
                      {ev.ageMa} Ma
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Extinction Geochemical Dossier */}
          <div className="lg:col-span-5 bg-[#050b14]/80 border border-[#f59e0b]/35 rounded-lg p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between font-mono-tabular text-xs">
              <span className="text-[#f59e0b] uppercase tracking-wider">
                Horizon · {selectedExtinction.ageMa} Ma
              </span>
              <span className="text-[#ffb4ab]">
                {selectedExtinction.generaLostPct}% Genera Lost
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-[#dbfcff]">
              {selectedExtinction.name}
            </h3>
            <div className="font-mono-tabular text-xs text-[#7bd0ff]">
              Primary Driver: {selectedExtinction.primaryDriver}
            </div>
            <p className="text-sm text-[#b9cacb] leading-relaxed">
              {selectedExtinction.description}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onJumpToEpochId(selectedExtinction.epochId)}
                className="flex items-center gap-2 px-3.5 py-2 rounded text-xs font-mono-tabular uppercase tracking-wider bg-[#00f0ff]/12 border border-[#00f0ff]/70 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#030712] transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>View Planetary State</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
