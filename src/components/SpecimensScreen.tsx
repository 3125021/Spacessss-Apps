import React, { useMemo, useState } from 'react';
import { GEOLOGICAL_SPECIMENS, Specimen } from '../data/earthData';
import { Search, X, Globe, ArrowUpRight } from 'lucide-react';

interface SpecimensScreenProps {
  onJumpToEpochId: (epochId: string) => void;
}

const CATEGORIES: Array<'All' | Specimen['category']> = [
  'All',
  'Mineral',
  'Fossil',
  'Impactite',
  'Ice & Core',
];

const SpecimenDiagram: React.FC<{ specimen: Specimen; large?: boolean }> = ({
  specimen,
  large = false,
}) => {
  const accent = specimen.accentHex;
  const h = large ? 220 : 148;

  return (
    <div
      className="relative w-full rounded bg-[#050b14] border border-[#38bdf8]/15 overflow-hidden flex items-center justify-center"
      style={{ height: `${h}px` }}
    >
      {/* Background scientific crosshair grid */}
      <svg
        viewBox="0 0 320 160"
        className="w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <pattern id={`grid-${specimen.id}-${large ? 'lg' : 'sm'}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(56, 189, 248, 0.08)"
              strokeWidth="0.6"
            />
          </pattern>
        </defs>
        <rect width="320" height="160" fill={`url(#grid-${specimen.id}-${large ? 'lg' : 'sm'})`} />

        {/* Crosshair Axes */}
        <line x1="160" y1="10" x2="160" y2="150" stroke="rgba(56,189,248,0.16)" strokeDasharray="3 3" />
        <line x1="20" y1="80" x2="300" y2="80" stroke="rgba(56,189,248,0.16)" strokeDasharray="3 3" />

        {specimen.diagramType === 'zircon' && (
          <g transform="translate(160, 80)">
            <polygon
              points="0,-52 32,-26 32,26 0,52 -32,26 -32,-26"
              fill={`${accent}20`}
              stroke={accent}
              strokeWidth="1.8"
            />
            <polygon
              points="0,-34 20,-17 20,17 0,34 -20,17 -20,-17"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <polygon
              points="0,-16 9,-8 9,8 0,16 -9,8 -9,-8"
              fill="#00f0ff"
              fillOpacity="0.3"
            />
            <circle cx="12" cy="-6" r="2.5" fill="#fff3ea" />
            <circle cx="-8" cy="14" r="2" fill="#00f0ff" />
          </g>
        )}

        {specimen.diagramType === 'bif' && (
          <g>
            {[28, 42, 54, 68, 82, 95, 108, 122].map((y, idx) => (
              <path
                key={y}
                d={`M 36 ${y} Q 110 ${y + (idx % 2 === 0 ? 5 : -5)} 180 ${y} T 284 ${y}`}
                fill="none"
                stroke={idx % 2 === 0 ? accent : '#94a3b8'}
                strokeWidth={idx % 2 === 0 ? 5.5 : 3}
                strokeOpacity={idx % 2 === 0 ? 0.78 : 0.45}
              />
            ))}
          </g>
        )}

        {specimen.diagramType === 'stromatolite' && (
          <g transform="translate(160, 134)">
            {[1, 0.82, 0.64, 0.46, 0.28].map((scale, i) => (
              <path
                key={i}
                d={`M ${-78 * scale} 0 Q ${-42 * scale} ${-92 * scale} 0 ${-108 * scale} Q ${
                  42 * scale
                } ${-92 * scale} ${78 * scale} 0`}
                fill="none"
                stroke={i % 2 === 0 ? accent : '#00f0ff'}
                strokeWidth="1.6"
                strokeOpacity={0.9 - i * 0.12}
              />
            ))}
          </g>
        )}

        {specimen.diagramType === 'fossil' && (
          <g transform="translate(160, 80)">
            <path
              d="M -78 14 C -44 -28, 22 -36, 76 -6 C 48 16, -12 36, -78 14 Z"
              fill={`${accent}18`}
              stroke={accent}
              strokeWidth="1.6"
            />
            {[-48, -28, -8, 12, 32, 50].map((x, idx) => (
              <path
                key={x}
                d={`M ${x} ${-16 + idx * 1.5} Q ${x - 6} 18 ${x - 14} ${38 - idx * 3}`}
                fill="none"
                stroke="#00f0ff"
                strokeWidth="1.4"
                strokeOpacity="0.75"
              />
            ))}
          </g>
        )}

        {specimen.diagramType === 'boundary' && (
          <g>
            <rect x="40" y="26" width="240" height="44" fill="rgba(56,189,248,0.1)" />
            <rect x="40" y="70" width="240" height="14" fill={`${accent}45`} />
            <rect x="40" y="84" width="240" height="50" fill="rgba(148,163,184,0.12)" />
            <line x1="40" y1="70" x2="280" y2="70" stroke={accent} strokeWidth="1.8" />
            <line x1="40" y1="84" x2="280" y2="84" stroke="#00f0ff" strokeWidth="1.2" strokeDasharray="4 3" />
            <text x="52" y="80" className="fill-[#fff3ea] text-[8px] font-mono">
              BOUNDARY CLAY HORIZON
            </text>
          </g>
        )}

        {specimen.diagramType === 'impact' && (
          <g transform="translate(160, 80)">
            <circle cx="0" cy="0" r="52" fill={`${accent}12`} stroke={accent} strokeWidth="1.4" strokeDasharray="5 3" />
            <circle cx="0" cy="0" r="32" fill="none" stroke="#00f0ff" strokeWidth="1.4" />
            <circle cx="0" cy="0" r="11" fill="#f59e0b" fillOpacity="0.35" stroke="#f59e0b" strokeWidth="1.2" />
            <line x1="-52" y1="-22" x2="52" y2="22" stroke="rgba(219,225,255,0.35)" strokeWidth="1" />
            <line x1="-42" y1="34" x2="42" y2="-34" stroke="rgba(219,225,255,0.35)" strokeWidth="1" />
          </g>
        )}

        {specimen.diagramType === 'icecore' && (
          <g transform="translate(160, 80)">
            <rect
              x="-88"
              y="-34"
              width="176"
              height="68"
              rx="6"
              fill="rgba(123, 208, 255, 0.14)"
              stroke={accent}
              strokeWidth="1.6"
            />
            {[-54, -22, 8, 36, 62].map((x) => (
              <line key={x} x1={x} y1="-34" x2={x} y2="34" stroke="rgba(0,240,255,0.3)" />
            ))}
            {[
              [-66, -12],
              [-36, 14],
              [-10, -18],
              [20, 6],
              [48, -10],
              [72, 16],
            ].map(([bx, by], idx) => (
              <circle key={idx} cx={bx} cy={by} r="3" fill="#dbfcff" fillOpacity="0.65" />
            ))}
          </g>
        )}

        {/* Scale Bar */}
        <line x1="24" y1="142" x2="74" y2="142" stroke="#7bd0ff" strokeWidth="1.5" />
        <text x="24" y="136" className="fill-[#7bd0ff] text-[8px] font-mono">
          {specimen.dimensions.split('×')[0].trim()}
        </text>
      </svg>

      <div className="absolute top-2.5 right-3 font-mono-tabular text-[10px] uppercase tracking-wider text-[#7bd0ff]">
        {specimen.accessionNumber}
      </div>
    </div>
  );
};

export const SpecimensScreen: React.FC<SpecimensScreenProps> = ({
  onJumpToEpochId,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | Specimen['category']>('All');
  const [activeSpecimen, setActiveSpecimen] = useState<Specimen | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GEOLOGICAL_SPECIMENS.filter((sp) => {
      const catOk = category === 'All' || sp.category === category;
      const searchOk =
        !q ||
        sp.name.toLowerCase().includes(q) ||
        sp.formation.toLowerCase().includes(q) ||
        sp.accessionNumber.toLowerCase().includes(q) ||
        sp.composition.toLowerCase().includes(q);
      return catOk && searchOk;
    });
  }, [search, category]);

  return (
    <div className="max-w-[1680px] mx-auto px-5 md:px-10 py-8 flex flex-col gap-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#38bdf8]/20 pb-6">
        <div>
          <div className="font-mono-tabular text-xs uppercase tracking-[0.12em] text-[#7bd0ff]">
            Curatorial Planetary Archive · {GEOLOGICAL_SPECIMENS.length} Cataloged Accessions
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#dbfcff] mt-1 tracking-tight text-balance">
            Geological Specimens & Boundary Cores
          </h1>
          <p className="text-sm text-[#b9cacb] mt-2 max-w-2xl">
            Physical rock cores, detrital minerals, soft-bodied fossils, and impactites anchoring Earth’s deep-time telemetry to empirical laboratory measurements.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#7bd0ff] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter accession, mineral, formation..."
              aria-label="Search geological specimens"
              className="w-full sm:w-64 pl-9 pr-3 py-2 rounded bg-[#050b14] border border-[#38bdf8]/25 text-xs text-[#dbe1ff] placeholder:text-[#849495] focus:outline-none focus:border-[#00f0ff] focus:shadow-[0_0_12px_rgba(0,240,255,0.2)]"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 rounded bg-[#050b14] border border-[#38bdf8]/20 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded text-xs font-mono-tabular transition-colors whitespace-nowrap shrink-0 ${
                  category === cat
                    ? 'bg-[#00f0ff]/18 text-[#00f0ff] border border-[#00f0ff]/50'
                    : 'text-[#b9cacb] hover:text-[#dbe1ff] border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Specimens Grid */}
      {filtered.length === 0 ? (
        <div className="observatory-deck rounded-lg p-12 text-center flex flex-col items-center gap-3">
          <p className="text-sm text-[#b9cacb]">
            No archived specimens match your current query.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategory('All');
            }}
            className="px-4 py-2 rounded text-xs font-mono-tabular uppercase tracking-wider bg-[#00f0ff]/15 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#030712] transition-colors"
          >
            Reset Archive Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {filtered.map((sp) => (
            <article
              key={sp.id}
              onClick={() => setActiveSpecimen(sp)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveSpecimen(sp);
                }
              }}
              className="observatory-deck observatory-deck-hover rounded-lg p-4 cursor-pointer flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col gap-3">
                <SpecimenDiagram specimen={sp} />

                <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#7bd0ff]">
                  <span>{sp.category}</span>
                  <span className="text-[#f59e0b]">{sp.ageLabel}</span>
                </div>

                <h2 className="font-display text-lg font-semibold text-[#dbfcff] leading-snug">
                  {sp.name}
                </h2>

                <p className="text-xs text-[#b9cacb] leading-relaxed line-clamp-3">
                  {sp.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#38bdf8]/15 flex items-center justify-between text-[11px] font-mono-tabular">
                <span className="text-[#849495] truncate max-w-[180px]">{sp.formation}</span>
                <span className="text-[#00f0ff] inline-flex items-center gap-1 shrink-0">
                  Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Level 4 Accession Detail Modal */}
      {activeSpecimen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Accession detail for ${activeSpecimen.name}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md"
          onClick={() => setActiveSpecimen(null)}
        >
          <div
            className="observatory-inspect reticle-frame rounded-lg max-w-3xl w-full p-6 md:p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#38bdf8]/20 pb-4">
              <div>
                <div className="font-mono-tabular text-xs uppercase tracking-[0.12em] text-[#7bd0ff]">
                  Accession {activeSpecimen.accessionNumber} · {activeSpecimen.category}
                </div>
                <h2 className="font-display text-2xl font-bold text-[#dbfcff] mt-1">
                  {activeSpecimen.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveSpecimen(null)}
                aria-label="Close accession modal"
                className="p-2 rounded text-[#b9cacb] hover:text-[#00f0ff] hover:bg-[#212942] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <SpecimenDiagram specimen={activeSpecimen} large />

            <p className="text-sm leading-relaxed text-[#dbe1ff]">
              {activeSpecimen.description}
            </p>

            {/* Structured Accession Definition Grid */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#050b14]/80 border border-[#38bdf8]/20 rounded-lg p-4 text-xs">
              <div>
                <dt className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#849495]">
                  Radiometric Age
                </dt>
                <dd className="font-mono-tabular text-[#f59e0b] mt-0.5">{activeSpecimen.ageLabel}</dd>
              </div>
              <div>
                <dt className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#849495]">
                  Geographic Coordinates
                </dt>
                <dd className="font-mono-tabular text-[#dbe1ff] mt-0.5">{activeSpecimen.coordinates}</dd>
              </div>
              <div>
                <dt className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#849495]">
                  Geological Formation
                </dt>
                <dd className="text-[#dbe1ff] mt-0.5">{activeSpecimen.formation}</dd>
              </div>
              <div>
                <dt className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#849495]">
                  Specimen Dimensions
                </dt>
                <dd className="font-mono-tabular text-[#dbe1ff] mt-0.5">{activeSpecimen.dimensions}</dd>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-[#38bdf8]/15">
                <dt className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#849495]">
                  Mineralogy & Matrix
                </dt>
                <dd className="text-[#dbe1ff] mt-0.5">{activeSpecimen.composition}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#849495]">
                  Isotope & Proxy Signature
                </dt>
                <dd className="font-mono-tabular text-[#00f0ff] mt-0.5">{activeSpecimen.isotopeNote}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveSpecimen(null)}
                className="px-4 py-2 rounded text-xs font-mono-tabular uppercase tracking-wider bg-[#0a122a] border border-[#38bdf8]/30 text-[#dbe1ff] hover:border-[#38bdf8]/70 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const epochId = activeSpecimen.epochId;
                  setActiveSpecimen(null);
                  onJumpToEpochId(epochId);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded text-xs font-mono-tabular uppercase tracking-wider bg-[#00f0ff]/15 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#030712] transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Inspect Parent Epoch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
