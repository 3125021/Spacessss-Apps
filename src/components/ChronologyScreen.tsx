import React, { useMemo, useState } from 'react';
import { EARTH_EPOCHS, EonName, EpochData, EventCategory } from '../data/earthData';
import { Globe, ArrowRight, Layers } from 'lucide-react';

interface ChronologyScreenProps {
  activeEpochIndex: number;
  onLaunchInObservatory: (epochIndex: number) => void;
}

const EON_FILTERS: Array<'All' | EonName> = ['All', 'Hadean', 'Archean', 'Proterozoic', 'Phanerozoic'];
const CATEGORY_FILTERS: Array<'All' | EventCategory> = [
  'All',
  'Tectonic',
  'Atmospheric',
  'Biological',
  'Extinction',
];

export const ChronologyScreen: React.FC<ChronologyScreenProps> = ({
  activeEpochIndex,
  onLaunchInObservatory,
}) => {
  const [eonFilter, setEonFilter] = useState<'All' | EonName>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | EventCategory>('All');
  const [selectedId, setSelectedId] = useState<string>(
    EARTH_EPOCHS[Math.round(activeEpochIndex)]?.id || EARTH_EPOCHS[0].id
  );

  const filteredEpochs = useMemo(() => {
    return EARTH_EPOCHS.filter((ep) => {
      const eonOk = eonFilter === 'All' || ep.eon === eonFilter;
      const catOk = categoryFilter === 'All' || ep.category === categoryFilter;
      return eonOk && catOk;
    });
  }, [eonFilter, categoryFilter]);

  const focusedEpoch: EpochData =
    filteredEpochs.find((e) => e.id === selectedId) ||
    filteredEpochs[0] ||
    EARTH_EPOCHS[0];

  // Reverse stratigraphic order: youngest (Holocene) at top, oldest (Hadean) at base
  const stratigraphicOrder = useMemo(() => [...EARTH_EPOCHS].reverse(), []);

  return (
    <div className="max-w-[1680px] mx-auto px-5 md:px-10 py-8 flex flex-col gap-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#38bdf8]/20 pb-6">
        <div>
          <div className="font-mono-tabular text-xs uppercase tracking-[0.12em] text-[#7bd0ff]">
            Stratigraphic Archive · 4.543 Ga to Present
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#dbfcff] mt-1 tracking-tight text-balance">
            Deep-Time Geological Chronology
          </h1>
          <p className="text-sm text-[#b9cacb] mt-2 max-w-2xl">
            Navigate Earth’s lithospheric and atmospheric strata from the molten Hadean mantle to the Quaternary cryosphere. Select any horizon to examine field milestones or launch it in the 3D observatory.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Eon Filter Segmented Bar */}
          <div className="flex items-center gap-1 p-1 rounded bg-[#050b14] border border-[#38bdf8]/20 overflow-x-auto">
            {EON_FILTERS.map((eon) => (
              <button
                key={eon}
                type="button"
                onClick={() => setEonFilter(eon)}
                className={`px-3 py-1.5 rounded text-xs font-mono-tabular transition-colors whitespace-nowrap shrink-0 ${
                  eonFilter === eon
                    ? 'bg-[#00f0ff]/18 text-[#00f0ff] border border-[#00f0ff]/50'
                    : 'text-[#b9cacb] hover:text-[#dbe1ff] border border-transparent'
                }`}
              >
                {eon}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 p-1 rounded bg-[#050b14] border border-[#38bdf8]/20 overflow-x-auto">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded text-xs font-mono-tabular transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-[#38bdf8]/20 text-[#dbfcff] border border-[#38bdf8]/60'
                    : 'text-[#b9cacb] hover:text-[#dbe1ff] border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split: Stratigraphic Gauge (Left 4 cols) + Exhibition Dossier & Cards (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Stratigraphic Column Gauge */}
        <aside className="lg:col-span-4 observatory-deck rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00f0ff]" />
              <h2 className="font-display text-base font-semibold text-[#dbfcff]">
                Geological Stratum Column
              </h2>
            </div>
            <span className="font-mono-tabular text-[11px] text-[#7bd0ff]">Youngest Top</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {stratigraphicOrder.map((ep) => {
              const isSelected = focusedEpoch.id === ep.id;
              const matchesFilter = filteredEpochs.some((f) => f.id === ep.id);
              const barHeight = Math.max(46, Math.min(76, 44 + Math.log10(ep.durationMyr + 10) * 10));

              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => setSelectedId(ep.id)}
                  style={{ minHeight: `${barHeight}px` }}
                  className={`w-full text-left px-3.5 py-2.5 rounded border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#00f0ff]/12 border-[#00f0ff] shadow-[0_0_16px_rgba(0,240,255,0.2)]'
                      : matchesFilter
                      ? 'bg-[#050b14]/75 border-[#38bdf8]/20 hover:border-[#38bdf8]/50'
                      : 'bg-[#050b14]/30 border-[#38bdf8]/10 opacity-45 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2.5 h-8 rounded-sm shrink-0"
                      style={{
                        backgroundColor: ep.visuals.atmosphereHex,
                        opacity: isSelected ? 1 : 0.65,
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#7bd0ff]">
                        {ep.eon} · {ep.category}
                      </div>
                      <div className="font-display text-sm font-semibold text-[#dbfcff] truncate">
                        {ep.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono-tabular">
                    <div className={`text-xs font-medium ${isSelected ? 'text-[#00f0ff]' : 'text-[#dbe1ff]'}`}>
                      {ep.ageGa.toFixed(2)} Ga
                    </div>
                    <div className="text-[10px] text-[#849495]">
                      {ep.durationMyr < 1 ? '12 kyr' : `${ep.durationMyr} Myr`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Detailed Exhibition Dossier + Filtered Grid */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {/* Focused Epoch Exhibition Card */}
          <article className="observatory-deck reticle-frame rounded-lg p-6 md:p-8 flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#38bdf8]/15 pb-5">
              <div>
                <div className="flex items-center gap-2 font-mono-tabular text-xs uppercase tracking-wider text-[#7bd0ff]">
                  <span>Epoch {String(focusedEpoch.index).padStart(2, '0')}</span>
                  <span aria-hidden="true">/</span>
                  <span>{focusedEpoch.eon} Eon</span>
                  <span aria-hidden="true">/</span>
                  <span className="text-[#f59e0b]">{focusedEpoch.ageSpanLabel}</span>
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-[#dbfcff] mt-2 text-balance">
                  {focusedEpoch.name}
                </h2>
                <p className="font-display text-base text-[#7bd0ff] mt-1">
                  {focusedEpoch.headline}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onLaunchInObservatory(focusedEpoch.index - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded text-xs font-mono-tabular uppercase tracking-[0.08em] bg-[#00f0ff]/15 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#030712] hover:shadow-[0_0_16px_rgba(0,240,255,0.4)] transition-all whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <Globe className="w-4 h-4" />
                <span>Inspect in Observatory</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <h3 className="font-mono-tabular text-[11px] uppercase tracking-[0.12em] text-[#7bd0ff]">
                  Planetary Narrative
                </h3>
                <p className="text-sm leading-relaxed text-[#dbe1ff]">
                  {focusedEpoch.summary}
                </p>
                <p className="text-sm leading-relaxed text-[#b9cacb]">
                  {focusedEpoch.scientificContext}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="font-mono-tabular text-[11px] uppercase tracking-[0.12em] text-[#7bd0ff]">
                  Verified Milestones
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {focusedEpoch.milestones.map((m, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-[#dbe1ff] bg-[#050b14]/65 border border-[#38bdf8]/15 rounded px-3 py-2"
                    >
                      <span className="font-mono-tabular text-xs text-[#00f0ff] mt-0.5 shrink-0">
                        0{i + 1}.
                      </span>
                      <span className="leading-snug">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Calibration Summary Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#38bdf8]/15 font-mono-tabular">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#849495]">Mean Temp</div>
                <div className="text-lg font-semibold text-[#dbfcff] mt-0.5">
                  {focusedEpoch.telemetry.meanTempC >= 0 ? '+' : ''}
                  {focusedEpoch.telemetry.meanTempC}°C
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#849495]">Atmospheric O₂</div>
                <div className="text-lg font-semibold text-[#00f0ff] mt-0.5">
                  {focusedEpoch.telemetry.o2Pct.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#849495]">Atmospheric CO₂</div>
                <div className="text-lg font-semibold text-[#f59e0b] mt-0.5">
                  {focusedEpoch.telemetry.co2Ppm >= 10000
                    ? `${(focusedEpoch.telemetry.co2Ppm / 10000).toFixed(1)}%`
                    : `${focusedEpoch.telemetry.co2Ppm.toLocaleString()} ppm`}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#849495]">Day Length</div>
                <div className="text-lg font-semibold text-[#dbfcff] mt-0.5">
                  {focusedEpoch.telemetry.dayLengthHours.toFixed(1)} hrs
                </div>
              </div>
            </div>
          </article>

          {/* Filtered Matching Epochs Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-mono-tabular text-xs uppercase tracking-[0.12em] text-[#7bd0ff]">
                Matching Horizons ({filteredEpochs.length})
              </h3>
              {(eonFilter !== 'All' || categoryFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setEonFilter('All');
                    setCategoryFilter('All');
                  }}
                  className="font-mono-tabular text-xs text-[#00f0ff] hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {filteredEpochs.length === 0 ? (
              <div className="observatory-deck rounded-lg p-8 text-center">
                <p className="text-sm text-[#b9cacb]">
                  No geological horizons match both {eonFilter} and {categoryFilter}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEpochs.map((ep) => {
                  const active = ep.id === focusedEpoch.id;
                  return (
                    <div
                      key={ep.id}
                      onClick={() => setSelectedId(ep.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(ep.id);
                        }
                      }}
                      className={`observatory-deck observatory-deck-hover rounded-lg p-4 cursor-pointer flex flex-col justify-between gap-3 ${
                        active ? 'border-[#00f0ff]/75 bg-[#0a122a]/85' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#7bd0ff]">
                          <span>
                            {ep.eon} · {ep.category}
                          </span>
                          <span>{ep.ageSpanLabel}</span>
                        </div>
                        <h4 className="font-display text-lg font-semibold text-[#dbfcff] mt-1">
                          {ep.name}
                        </h4>
                        <p className="text-xs text-[#b9cacb] mt-1.5 line-clamp-2 leading-relaxed">
                          {ep.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#38bdf8]/15 text-xs font-mono-tabular">
                        <span className="text-[#dbe1ff]">
                          Temp {ep.telemetry.meanTempC}°C · O₂ {ep.telemetry.o2Pct}%
                        </span>
                        <span className="text-[#00f0ff] inline-flex items-center gap-1">
                          Select <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
