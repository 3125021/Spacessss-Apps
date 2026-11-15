import React, { useState } from 'react';
import { EARTH_EPOCHS, EpochData } from '../data/earthData';
import { PlanetaryGlobe } from './PlanetaryGlobe';
import { X, ArrowRight } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEpochAId?: string;
  onJumpToEpochId: (epochId: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  initialEpochAId,
  onJumpToEpochId,
}) => {
  const [epochAId, setEpochAId] = useState<string>(initialEpochAId || EARTH_EPOCHS[0].id);
  const [epochBId, setEpochBId] = useState<string>(EARTH_EPOCHS[EARTH_EPOCHS.length - 1].id);

  if (!isOpen) return null;

  const epochA: EpochData = EARTH_EPOCHS.find((e) => e.id === epochAId) || EARTH_EPOCHS[0];
  const epochB: EpochData =
    EARTH_EPOCHS.find((e) => e.id === epochBId) || EARTH_EPOCHS[EARTH_EPOCHS.length - 1];

  const compactLayers = {
    atmosphere: true,
    graticule: true,
    tectonics: false,
    thermal: false,
    beacons: false,
  };

  const rows: Array<{
    label: string;
    valA: string;
    valB: string;
    delta: string;
  }> = [
    {
      label: 'Mean Surface Temp',
      valA: `${epochA.telemetry.meanTempC >= 0 ? '+' : ''}${epochA.telemetry.meanTempC.toFixed(1)} °C`,
      valB: `${epochB.telemetry.meanTempC >= 0 ? '+' : ''}${epochB.telemetry.meanTempC.toFixed(1)} °C`,
      delta: `${epochB.telemetry.meanTempC - epochA.telemetry.meanTempC >= 0 ? '+' : ''}${(
        epochB.telemetry.meanTempC - epochA.telemetry.meanTempC
      ).toFixed(1)} °C`,
    },
    {
      label: 'Atmospheric O₂',
      valA: `${epochA.telemetry.o2Pct.toFixed(2)} %`,
      valB: `${epochB.telemetry.o2Pct.toFixed(2)} %`,
      delta: `${epochB.telemetry.o2Pct - epochA.telemetry.o2Pct >= 0 ? '+' : ''}${(
        epochB.telemetry.o2Pct - epochA.telemetry.o2Pct
      ).toFixed(2)} %`,
    },
    {
      label: 'Atmospheric CO₂',
      valA: `${epochA.telemetry.co2Ppm.toLocaleString()} ppm`,
      valB: `${epochB.telemetry.co2Ppm.toLocaleString()} ppm`,
      delta: `${epochB.telemetry.co2Ppm - epochA.telemetry.co2Ppm >= 0 ? '+' : ''}${(
        epochB.telemetry.co2Ppm - epochA.telemetry.co2Ppm
      ).toLocaleString()} ppm`,
    },
    {
      label: 'Solar Rotation (Day)',
      valA: `${epochA.telemetry.dayLengthHours.toFixed(1)} hrs`,
      valB: `${epochB.telemetry.dayLengthHours.toFixed(1)} hrs`,
      delta: `${epochB.telemetry.dayLengthHours - epochA.telemetry.dayLengthHours >= 0 ? '+' : ''}${(
        epochB.telemetry.dayLengthHours - epochA.telemetry.dayLengthHours
      ).toFixed(1)} hrs`,
    },
    {
      label: 'Surface Pressure',
      valA: `${epochA.telemetry.pressureBar.toFixed(2)} bar`,
      valB: `${epochB.telemetry.pressureBar.toFixed(2)} bar`,
      delta: `${epochB.telemetry.pressureBar - epochA.telemetry.pressureBar >= 0 ? '+' : ''}${(
        epochB.telemetry.pressureBar - epochA.telemetry.pressureBar
      ).toFixed(2)} bar`,
    },
    {
      label: 'Solar Luminosity',
      valA: `${epochA.telemetry.solarLuminosityPct.toFixed(1)} % L☉`,
      valB: `${epochB.telemetry.solarLuminosityPct.toFixed(1)} % L☉`,
      delta: `${
        epochB.telemetry.solarLuminosityPct - epochA.telemetry.solarLuminosityPct >= 0 ? '+' : ''
      }${(epochB.telemetry.solarLuminosityPct - epochA.telemetry.solarLuminosityPct).toFixed(1)} %`,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Compare Geological Epochs"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="observatory-inspect reticle-frame rounded-lg max-w-4xl w-full p-6 md:p-8 flex flex-col gap-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#38bdf8]/20 pb-4">
          <div>
            <div className="font-mono-tabular text-[11px] uppercase tracking-[0.12em] text-[#7bd0ff]">
              Planetary Telemetry Differential
            </div>
            <h2 className="font-display text-2xl font-bold text-[#dbfcff] mt-0.5">
              Compare Any Two Epochs
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison dialog"
            className="p-2 rounded text-[#b9cacb] hover:text-[#00f0ff] hover:bg-[#212942] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Selectors + Mini Interactive Globes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: 'Horizon A (Baseline)', epoch: epochA, setId: setEpochAId },
            { label: 'Horizon B (Target)', epoch: epochB, setId: setEpochBId },
          ].map(({ label, epoch, setId }, idx) => (
            <div
              key={idx}
              className="bg-[#050b14]/80 border border-[#38bdf8]/20 rounded-lg p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#7bd0ff]">
                  {label}
                </span>
                <span className="font-mono-tabular text-xs text-[#f59e0b]">
                  {epoch.ageSpanLabel}
                </span>
              </div>

              <select
                value={epoch.id}
                onChange={(e) => setId(e.target.value)}
                aria-label={label}
                className="w-full px-3 py-2 rounded bg-[#0a122a] border border-[#38bdf8]/30 text-sm font-display text-[#dbfcff] focus:outline-none focus:border-[#00f0ff]"
              >
                {EARTH_EPOCHS.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {String(ep.index).padStart(2, '0')}. {ep.name} ({ep.ageGa.toFixed(2)} Ga)
                  </option>
                ))}
              </select>

              <div className="h-[240px] w-full flex items-center justify-center">
                <PlanetaryGlobe
                  epoch={epoch}
                  interpolatedVisuals={epoch.visuals}
                  interpolatedAgeGa={epoch.ageGa}
                  interpolatedTempC={epoch.telemetry.meanTempC}
                  layers={compactLayers}
                  onToggleLayer={() => {}}
                  selectedSite={null}
                  onSelectSite={() => {}}
                  compact
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#38bdf8]/15">
                <span className="text-xs text-[#b9cacb] truncate">{epoch.eon} Eon</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onJumpToEpochId(epoch.id);
                  }}
                  className="text-xs font-mono-tabular text-[#00f0ff] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>Load in Observatory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tabular Differential Table */}
        <div className="overflow-x-auto border border-[#38bdf8]/20 rounded-lg bg-[#050b14]/75">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#38bdf8]/20 font-mono-tabular text-[11px] uppercase tracking-wider text-[#7bd0ff]">
                <th className="py-3 px-4">Parameter</th>
                <th className="py-3 px-4">{epochA.shortName}</th>
                <th className="py-3 px-4">{epochB.shortName}</th>
                <th className="py-3 px-4 text-right">Differential (B − A)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#38bdf8]/10 text-xs font-mono-tabular">
              {rows.map((r) => (
                <tr key={r.label} className="hover:bg-[#131a33]/60 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-[#dbe1ff] font-medium">{r.label}</td>
                  <td className="py-2.5 px-4 text-[#b9cacb]">{r.valA}</td>
                  <td className="py-2.5 px-4 text-[#dbfcff]">{r.valB}</td>
                  <td className="py-2.5 px-4 text-right text-[#00f0ff] font-medium">{r.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
