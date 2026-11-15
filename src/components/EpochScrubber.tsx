import React from 'react';
import { EARTH_EPOCHS } from '../data/earthData';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

interface EpochScrubberProps {
  timelinePos: number; // 0 to EARTH_EPOCHS.length - 1 (continuous)
  onChangePos: (pos: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  interpolatedAgeGa: number;
}

export const EpochScrubber: React.FC<EpochScrubberProps> = ({
  timelinePos,
  onChangePos,
  isPlaying,
  onTogglePlay,
  interpolatedAgeGa,
}) => {
  const maxIndex = EARTH_EPOCHS.length - 1;
  const pct = (timelinePos / maxIndex) * 100;
  const nearestIdx = Math.round(timelinePos);
  const nearestEpoch = EARTH_EPOCHS[nearestIdx];

  return (
    <section
      aria-label="Orbital Epoch Scrubber"
      className="observatory-deck rounded-lg px-4 py-3.5 md:px-6 md:py-4"
    >
      <div className="flex flex-col gap-3">
        {/* Top Row: Play Controls + Live Chronological Readout */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTogglePlay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-tabular uppercase tracking-wider bg-[#00f0ff]/15 border border-[#00f0ff]/70 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#030712] transition-colors min-h-[36px] whitespace-nowrap"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Auto-Sweep'}</span>
            </button>

            <div className="flex items-center border border-[#38bdf8]/20 rounded bg-[#050b14]">
              <button
                type="button"
                onClick={() => onChangePos(Math.max(0, Math.round(timelinePos) - 1))}
                disabled={nearestIdx === 0}
                aria-label="Previous epoch"
                className="p-2 text-[#b9cacb] hover:text-[#00f0ff] disabled:opacity-35 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 text-xs font-mono-tabular text-[#dbe1ff] whitespace-nowrap">
                {String(nearestEpoch.index).padStart(2, '0')} / {String(EARTH_EPOCHS.length).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => onChangePos(Math.min(maxIndex, Math.round(timelinePos) + 1))}
                disabled={nearestIdx === maxIndex}
                aria-label="Next epoch"
                className="p-2 text-[#b9cacb] hover:text-[#00f0ff] disabled:opacity-35 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#b9cacb]">
                {nearestEpoch.eon} Eon · {nearestEpoch.era}
              </div>
              <div className="font-display text-base md:text-lg font-semibold text-[#dbfcff]">
                {nearestEpoch.name}
              </div>
            </div>
            <div className="pl-4 border-l border-[#38bdf8]/20">
              <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#7bd0ff]">
                Chronological Horizon
              </div>
              <div className="font-mono-tabular text-lg font-medium text-[#00f0ff]">
                {interpolatedAgeGa.toFixed(3)} Ga
              </div>
            </div>
          </div>
        </div>

        {/* Continuous Precision Rail + Checkpoint Nodes */}
        <div className="relative pt-2 pb-1">
          {/* Rail Track */}
          <div className="relative h-[2px] bg-[#38bdf8]/20 rounded-full">
            <div
              className="absolute left-0 top-0 h-full bg-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.75)] rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Native Accessible Range Scrubber */}
          <input
            type="range"
            min={0}
            max={maxIndex}
            step={0.01}
            value={timelinePos}
            aria-label="Scrub geological timeline from 4.54 billion years ago to present"
            onChange={(e) => onChangePos(parseFloat(e.target.value))}
            className="epoch-slider relative z-10 w-full -mt-2.5 block"
          />

          {/* Interactive Epoch Checkpoints */}
          <div className="hidden md:flex items-center justify-between mt-1.5">
            {EARTH_EPOCHS.map((ep, idx) => {
              const isActive = Math.abs(timelinePos - idx) < 0.45;
              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => onChangePos(idx)}
                  className={`group flex flex-col items-center gap-1 px-1.5 py-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00f0ff] ${
                    isActive ? 'text-[#00f0ff]' : 'text-[#849495] hover:text-[#dbe1ff]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      isActive
                        ? 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] scale-125'
                        : 'bg-[#38bdf8]/35 group-hover:bg-[#7bd0ff]'
                    }`}
                  />
                  <span className="font-mono-tabular text-[10px] tracking-wider whitespace-nowrap">
                    {ep.shortName}
                  </span>
                  <span className="font-mono-tabular text-[9px] opacity-70">
                    {ep.ageGa.toFixed(2)} Ga
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
