import React from 'react';
import { GitCompareArrows } from 'lucide-react';

export type AppScreen =
  | 'observatory'
  | 'satellite'
  | 'chronology'
  | 'spectroscopy'
  | 'specimens'
  | 'sources';

interface TopNavProps {
  activeScreen: AppScreen;
  onChangeScreen: (screen: AppScreen) => void;
  onOpenCompare: () => void;
}

const NAV_ITEMS: Array<{ id: AppScreen; label: string }> = [
  { id: 'observatory', label: 'Observatory' },
  { id: 'satellite', label: 'Satellite Observations' },
  { id: 'chronology', label: 'Chronology' },
  { id: 'spectroscopy', label: 'Spectroscopy' },
  { id: 'specimens', label: 'Specimens' },
  { id: 'sources', label: 'Data Sources' },
];

export const TopNav: React.FC<TopNavProps> = ({
  activeScreen,
  onChangeScreen,
  onOpenCompare,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#030712]/85 backdrop-blur-xl border-b border-[#38bdf8]/20">
      <div className="max-w-[1680px] mx-auto px-5 md:px-10 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onChangeScreen('observatory')}
          className="font-display text-lg font-bold tracking-tight text-[#dbfcff] hover:text-[#00f0ff] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] rounded px-1"
        >
          Earth Through Time
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary sections"
          className="flex items-center gap-4 md:gap-7 overflow-x-auto no-scrollbar"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeScreen(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] rounded px-1 ${
                  active
                    ? 'text-[#00f0ff]'
                    : 'text-[#b9cacb] hover:text-[#dbe1ff]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1 right-1 bottom-0 h-[2px] bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.75)]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary telemetry action */}
        <div className="hidden sm:flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenCompare}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-mono-tabular uppercase tracking-[0.08em] bg-[#00f0ff]/15 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#030712] hover:shadow-[0_0_16px_rgba(0,240,255,0.4)] transition-all duration-150 whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
            <span>Compare Epochs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
