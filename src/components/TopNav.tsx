import React from 'react';
import { GitCompareArrows } from 'lucide-react';

interface TopNavProps {
  onOpenCompare: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenCompare }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#030712]/85 backdrop-blur-xl border-b border-[#38bdf8]/20">
      <div className="max-w-[1680px] mx-auto px-5 md:px-10 h-16 flex items-center justify-between gap-8">
        {/* Brand title */}
        <span className="font-display text-lg font-bold tracking-tight text-[#dbfcff] whitespace-nowrap shrink-0">
          Global Time
        </span>

        {/* Primary comparison modal action */}
        <div className="flex items-center shrink-0">
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
