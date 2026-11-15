import React, { useState, useCallback } from 'react';
import { EARTH_EPOCHS, EpochData, FieldSite } from '../data/earthData';
import {
  SAR_OBSERVATIONS,
  SAR_PHENOMENON_COLORS,
  SATELLITE_ERAS,
  SarObservationSite,
  SarPhenomenon,
  LiveSarGranule,
  LiveEonetEvent,
} from '../data/sarData';
import { PlanetaryGlobe, GlobeLayerState } from './PlanetaryGlobe';
import { EpochScrubber } from './EpochScrubber';
import {
  MapPin,
  X,
  Thermometer,
  Clock,
  Gauge,
  Sun,
  Waves,
  Shield,
  Radar,
  Globe,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';

export type ExplorationMode = 'geological' | 'satellite';

interface ObservatoryScreenProps {
  explorationMode: ExplorationMode;
  onChangeMode: (mode: ExplorationMode) => void;
  timelinePos: number;
  onChangeTimelinePos: (pos: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  selectedSarSite: SarObservationSite;
  onSelectSarSite: (site: SarObservationSite) => void;
  liveGranules: LiveSarGranule[];
  onUpdateLiveGranules: (granules: LiveSarGranule[]) => void;
  eonetEvents: LiveEonetEvent[];
  earthdataToken: string;
  focusTarget: { lat: number; lon: number; nonce: number } | null;
  onFocusCoords: (lat: number, lon: number) => void;
  onOpenSarComparator: () => void;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const a = parseInt(hexA.replace('#', ''), 16);
  const b = parseInt(hexB.replace('#', ''), 16);
  const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t));
  const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
  const bl = Math.round(lerp(a & 255, b & 255, t));
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

const MODERN_EARTH_EPOCH = EARTH_EPOCHS[EARTH_EPOCHS.length - 1];

export const ObservatoryScreen: React.FC<ObservatoryScreenProps> = ({
  explorationMode,
  onChangeMode,
  timelinePos,
  onChangeTimelinePos,
  isPlaying,
  onTogglePlay,
  selectedSarSite,
  onSelectSarSite,
  liveGranules,
  onUpdateLiveGranules,
  eonetEvents,
  earthdataToken,
  focusTarget,
  onFocusCoords,
  onOpenSarComparator,
}) => {
  const [layers, setLayers] = useState<GlobeLayerState>({
    atmosphere: true,
    graticule: true,
    tectonics: true,
    thermal: false,
    beacons: true,
    modernContinents: false,
  });

  const [selectedSite, setSelectedSite] = useState<FieldSite | null>(null);
  const [selectedGranule, setSelectedGranule] = useState<LiveSarGranule | null>(null);
  const [satEraIdx, setSatEraIdx] = useState<number>(SATELLITE_ERAS.length - 1);
  const [showLiveSwaths, setShowLiveSwaths] = useState<boolean>(true);
  const [isScanningRegion, setIsScanningRegion] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const [activeSarPhenomena, setActiveSarPhenomena] = useState<Record<SarPhenomenon, boolean>>({
    Flooding: true,
    Vegetation: true,
    Wildfire: true,
    Deformation: true,
    Glacier: true,
  });

  const toggleLayer = (key: keyof GlobeLayerState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePhenomenon = (p: SarPhenomenon) => {
    setActiveSarPhenomena((prev) => ({ ...prev, [p]: !prev[p] }));
  };

  // Scan live NASA CMR / ASF Search GeoJSON granules for the globe viewport center
  const handleScanRegion = useCallback(
    async (lat: number, lon: number) => {
      setIsScanningRegion(true);
      setScanMessage(null);
      try {
        const headers: Record<string, string> = {};
        if (earthdataToken.trim()) headers['x-earthdata-token'] = earthdataToken.trim();
        const params = new URLSearchParams({
          lat: lat.toFixed(2),
          lon: lon.toFixed(2),
          radiusDeg: '2.5',
          platform: 'ALL',
          maxResults: '10',
        });
        const res = await fetch(`/api/sar/search?${params.toString()}`, { headers });
        const data = (await res.json()) as {
          ok: boolean;
          granules?: LiveSarGranule[];
          upstreamNotes?: string[];
        };
        const found = data.granules || [];
        onUpdateLiveGranules(found);
        setShowLiveSwaths(true);
        if (found.length > 0) {
          setSelectedGranule(found[0]);
          setScanMessage(
            `ASF/CMR live scan near (${lat.toFixed(1)}°, ${lon.toFixed(1)}°): ${found.length} SAR swaths mapped.`
          );
        } else {
          setScanMessage(
            data.upstreamNotes?.[0] ||
              `No SAR swaths returned near (${lat.toFixed(1)}°, ${lon.toFixed(1)}°).`
          );
        }
      } catch (err) {
        setScanMessage(err instanceof Error ? err.message : 'Unable to reach /api/sar/search.');
      } finally {
        setIsScanningRegion(false);
      }
    },
    [earthdataToken, onUpdateLiveGranules]
  );

  // Interpolate smoothly between adjacent geological epochs when in Geological Time
  const maxIdx = EARTH_EPOCHS.length - 1;
  const clamped = Math.max(0, Math.min(maxIdx, timelinePos));
  const idxA = Math.floor(clamped);
  const idxB = Math.min(maxIdx, idxA + 1);
  const frac = clamped - idxA;

  const epochA = EARTH_EPOCHS[idxA];
  const epochB = EARTH_EPOCHS[idxB];
  const activeGeoEpoch: EpochData = frac < 0.5 ? epochA : epochB;

  const isSatelliteMode = explorationMode === 'satellite';
  const globeEpoch = isSatelliteMode ? MODERN_EARTH_EPOCH : activeGeoEpoch;

  const interpolatedAgeGa = isSatelliteMode
    ? 0
    : lerp(epochA.ageGa, epochB.ageGa, frac);

  const interpolatedTelemetry = isSatelliteMode
    ? MODERN_EARTH_EPOCH.telemetry
    : {
        meanTempC: lerp(epochA.telemetry.meanTempC, epochB.telemetry.meanTempC, frac),
        pressureBar: lerp(epochA.telemetry.pressureBar, epochB.telemetry.pressureBar, frac),
        dayLengthHours: lerp(epochA.telemetry.dayLengthHours, epochB.telemetry.dayLengthHours, frac),
        solarLuminosityPct: lerp(epochA.telemetry.solarLuminosityPct, epochB.telemetry.solarLuminosityPct, frac),
        seaLevelOffsetM: lerp(epochA.telemetry.seaLevelOffsetM, epochB.telemetry.seaLevelOffsetM, frac),
        magneticFieldPct: lerp(epochA.telemetry.magneticFieldPct, epochB.telemetry.magneticFieldPct, frac),
        co2Ppm: lerp(epochA.telemetry.co2Ppm, epochB.telemetry.co2Ppm, frac),
        o2Pct: lerp(epochA.telemetry.o2Pct, epochB.telemetry.o2Pct, frac),
        n2Pct: lerp(epochA.telemetry.n2Pct, epochB.telemetry.n2Pct, frac),
        ch4Ppm: lerp(epochA.telemetry.ch4Ppm, epochB.telemetry.ch4Ppm, frac),
      };

  const interpolatedVisuals: EpochData['visuals'] = isSatelliteMode
    ? MODERN_EARTH_EPOCH.visuals
    : {
        oceanHex: lerpHex(epochA.visuals.oceanHex, epochB.visuals.oceanHex, frac),
        deepOceanHex: lerpHex(epochA.visuals.deepOceanHex, epochB.visuals.deepOceanHex, frac),
        landHex: lerpHex(epochA.visuals.landHex, epochB.visuals.landHex, frac),
        highlandHex: lerpHex(epochA.visuals.highlandHex, epochB.visuals.highlandHex, frac),
        iceColorHex: lerpHex(epochA.visuals.iceColorHex, epochB.visuals.iceColorHex, frac),
        iceCoverage: lerp(epochA.visuals.iceCoverage, epochB.visuals.iceCoverage, frac),
        magmaGlow: lerp(epochA.visuals.magmaGlow, epochB.visuals.magmaGlow, frac),
        cloudCoverage: lerp(epochA.visuals.cloudCoverage, epochB.visuals.cloudCoverage, frac),
        atmosphereHex: lerpHex(epochA.visuals.atmosphereHex, epochB.visuals.atmosphereHex, frac),
        atmosphereIntensity: lerp(epochA.visuals.atmosphereIntensity, epochB.visuals.atmosphereIntensity, frac),
        continentSpread: lerp(epochA.visuals.continentSpread, epochB.visuals.continentSpread, frac),
        vegetationIntensity: lerp(epochA.visuals.vegetationIntensity, epochB.visuals.vegetationIntensity, frac),
      };

  const handleSelectEpochIdx = (idx: number) => {
    setSelectedSite(null);
    onChangeTimelinePos(idx);
  };

  const currentSatEra = SATELLITE_ERAS[satEraIdx] || SATELLITE_ERAS[SATELLITE_ERAS.length - 1];

  return (
    <div className="flex-1 w-full max-w-[1680px] mx-auto px-5 md:px-10 py-4 flex flex-col gap-4">
      {/* Observatory Mode Switch Ribbon (Distinguishes Geological Time vs Satellite Observation Time) */}
      <div className="observatory-deck rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded bg-[#050b14] border border-[#38bdf8]/20">
          <button
            type="button"
            onClick={() => onChangeMode('geological')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-mono-tabular uppercase tracking-wider transition-colors whitespace-nowrap ${
              explorationMode === 'geological'
                ? 'bg-[#00f0ff]/18 text-[#00f0ff] border border-[#00f0ff]/60'
                : 'text-[#b9cacb] hover:text-[#dbe1ff] border border-transparent'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Geological Time (4.54 Ga – Present)</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('satellite')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-mono-tabular uppercase tracking-wider transition-colors whitespace-nowrap ${
              explorationMode === 'satellite'
                ? 'bg-[#00f0ff]/18 text-[#00f0ff] border border-[#00f0ff]/60'
                : 'text-[#b9cacb] hover:text-[#dbe1ff] border border-transparent'
            }`}
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Satellite Observation Time (1995 – Present)</span>
          </button>
        </div>

        <div className="text-xs font-mono-tabular text-[#b9cacb]">
          {isSatelliteMode
            ? 'Modern Earth · Active Microwave SAR & NASA/ASF Observations'
            : `Paleogeographic Reconstruction · ${activeGeoEpoch.eon} Eon (${activeGeoEpoch.ageSpanLabel})`}
        </div>
      </div>

      {/* Main 12-Column Observatory Console */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-0">
        {/* Left Column: Deep-Time Stations OR SAR Observation Layers & Sites (3 cols) */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          {!isSatelliteMode ? (
            <div className="observatory-deck rounded-lg p-4 flex flex-col gap-3 h-full">
              <div className="flex items-center justify-between border-b border-[#38bdf8]/15 pb-3">
                <div>
                  <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#7bd0ff]">
                    Epoch Index
                  </div>
                  <h2 className="font-display text-base font-semibold text-[#dbfcff]">
                    Deep-Time Stations
                  </h2>
                </div>
                <span className="font-mono-tabular text-[11px] text-[#849495]">
                  {EARTH_EPOCHS.length} Epochs
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto min-h-[260px] max-h-[580px] pr-1">
                {EARTH_EPOCHS.map((ep, idx) => {
                  const isSelected = activeGeoEpoch.id === ep.id;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => handleSelectEpochIdx(idx)}
                      className={`w-full text-left px-3 py-2.5 rounded transition-all duration-150 border flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#00f0ff]/12 border-[#00f0ff]/70 text-[#dbfcff] shadow-[0_0_16px_rgba(0,240,255,0.16)]'
                          : 'bg-[#050b14]/55 border-[#38bdf8]/12 text-[#b9cacb] hover:border-[#38bdf8]/40 hover:text-[#dbe1ff]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[10px] font-mono-tabular uppercase tracking-wider text-[#7bd0ff]/80">
                          <span>{String(ep.index).padStart(2, '0')}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ep.eon}</span>
                        </div>
                        <div className="font-display text-sm font-medium truncate mt-0.5">
                          {ep.name}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`font-mono-tabular text-xs font-medium ${
                            isSelected ? 'text-[#00f0ff]' : 'text-[#849495]'
                          }`}
                        >
                          {ep.ageGa.toFixed(2)} Ga
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="observatory-deck rounded-lg p-4 flex flex-col gap-4 h-full">
              {/* Toggleable SAR Phenomenon Layers */}
              <div className="border-b border-[#38bdf8]/15 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#7bd0ff]">
                      Orbital Radar Layers
                    </div>
                    <h2 className="font-display text-base font-semibold text-[#dbfcff]">
                      Active SAR Overlays
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(SAR_PHENOMENON_COLORS) as SarPhenomenon[]).map((p) => {
                    const on = activeSarPhenomena[p];
                    const color = SAR_PHENOMENON_COLORS[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePhenomenon(p)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono-tabular border transition-colors ${
                          on
                            ? 'bg-[#0a122a] text-[#dbfcff] border-[#38bdf8]/55'
                            : 'bg-[#050b14]/40 text-[#849495] border-[#38bdf8]/15 opacity-60'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: on ? color : '#475569' }}
                        />
                        <span>{p}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowLiveSwaths((s) => !s)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono-tabular border transition-colors ${
                      showLiveSwaths
                        ? 'bg-[#00f0ff]/12 text-[#00f0ff] border-[#00f0ff]/60'
                        : 'bg-[#050b14]/40 text-[#849495] border-[#38bdf8]/15'
                    }`}
                  >
                    <span>Live ASF Swaths ({liveGranules.length})</span>
                  </button>
                </div>
              </div>

              {/* SAR Observation Sites Selector */}
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto min-h-[220px] max-h-[440px] pr-1">
                {SAR_OBSERVATIONS.filter((s) => activeSarPhenomena[s.phenomenon]).map((site) => {
                  const isSel = selectedSarSite.id === site.id;
                  const color = SAR_PHENOMENON_COLORS[site.phenomenon];
                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => {
                        onSelectSarSite(site);
                        onFocusCoords(site.lat, site.lon);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded border transition-all flex flex-col gap-1 ${
                        isSel
                          ? 'bg-[#00f0ff]/12 border-[#00f0ff]/75 text-[#dbfcff]'
                          : 'bg-[#050b14]/55 border-[#38bdf8]/12 text-[#b9cacb] hover:border-[#38bdf8]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono-tabular uppercase">
                        <span className="flex items-center gap-1.5 text-[#7bd0ff]">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {site.mission} · {site.phenomenon}
                        </span>
                        <span className="text-[#849495]">{site.year}</span>
                      </div>
                      <div className="font-display text-sm font-medium truncate">
                        {site.title}
                      </div>
                    </button>
                  );
                })}
              </div>

              {scanMessage && (
                <div className="mt-auto text-[11px] font-mono-tabular text-[#00f0ff] bg-[#050b14]/80 border border-[#00f0ff]/35 rounded p-2.5">
                  {scanMessage}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Center Column: Primary 3D Planetary Viewport (6 cols) */}
        <section
          aria-label="Interactive Planetary Viewport"
          className="lg:col-span-6 observatory-deck reticle-frame cosmic-grid rounded-lg relative min-h-[480px] lg:min-h-[620px] flex flex-col overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 48%, rgba(139, 92, 246, 0.11) 0%, rgba(10, 18, 42, 0.1) 52%, transparent 78%)',
            }}
          />

          <div className="relative flex-1 w-full h-full">
            <PlanetaryGlobe
              epoch={globeEpoch}
              interpolatedVisuals={interpolatedVisuals}
              interpolatedAgeGa={interpolatedAgeGa}
              interpolatedTempC={interpolatedTelemetry.meanTempC}
              layers={layers}
              onToggleLayer={toggleLayer}
              selectedSite={selectedSite}
              onSelectSite={setSelectedSite}
              explorationMode={explorationMode}
              sarSites={SAR_OBSERVATIONS}
              selectedSarSite={selectedSarSite}
              onSelectSarSite={(site) => {
                if (site) {
                  onSelectSarSite(site);
                  onFocusCoords(site.lat, site.lon);
                }
              }}
              liveGranules={liveGranules}
              selectedGranule={selectedGranule}
              onSelectGranule={setSelectedGranule}
              eonetEvents={eonetEvents}
              activeSarPhenomena={activeSarPhenomena}
              showLiveSwaths={showLiveSwaths}
              onScanRegion={handleScanRegion}
              isScanningRegion={isScanningRegion}
              focusTarget={focusTarget}
              isModernEra={isSatelliteMode || activeGeoEpoch.id === 'holocene'}
            />

            {/* Floating Level 3 Inspect Card for Selected Geological Site */}
            {!isSatelliteMode && selectedSite && (
              <div className="observatory-inspect rounded-lg p-4 absolute top-14 right-4 z-30 w-[290px] max-w-[calc(100%-2rem)]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#f59e0b]">
                      Field Site · {selectedSite.ageLabel}
                    </div>
                    <h3 className="font-display text-sm font-semibold text-[#dbfcff] mt-0.5">
                      {selectedSite.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSite(null)}
                    aria-label="Close site inspector"
                    className="p-1 rounded text-[#b9cacb] hover:text-[#00f0ff] hover:bg-[#212942]/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2 font-mono-tabular text-[11px] text-[#7bd0ff]">
                  {selectedSite.region} · {selectedSite.lat.toFixed(1)}°, {selectedSite.lon.toFixed(1)}°
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#dbe1ff]/90">
                  {selectedSite.summary}
                </p>
                <div className="mt-3 pt-2.5 border-t border-[#38bdf8]/20 font-mono-tabular text-[11px] text-[#00f0ff]">
                  {selectedSite.isotopeSignature}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Column (Upper-Right Information Panel): Geological Telemetry OR Expanded SAR Scientific Observations (3 cols) */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          {!isSatelliteMode ? (
            <>
              {/* Geological Physical Parameters */}
              <div className="observatory-deck rounded-lg p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#38bdf8]/15 pb-3">
                  <div>
                    <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#7bd0ff]">
                      Planetary Telemetry
                    </div>
                    <h2 className="font-display text-base font-semibold text-[#dbfcff]">
                      Physical Parameters
                    </h2>
                  </div>
                  <span className="font-mono-tabular text-xs text-[#f59e0b]">
                    {activeGeoEpoch.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#050b14]/80 border border-[#38bdf8]/15 rounded p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-tabular uppercase tracking-wider text-[#b9cacb]">
                      <Thermometer className="w-3 h-3 text-[#f59e0b]" />
                      <span>Mean Temp</span>
                    </div>
                    <div className="font-mono-tabular text-xl font-semibold text-[#dbfcff] mt-1">
                      {interpolatedTelemetry.meanTempC >= 0 ? '+' : ''}
                      {interpolatedTelemetry.meanTempC.toFixed(1)}
                      <span className="text-xs text-[#849495] ml-1">°C</span>
                    </div>
                  </div>

                  <div className="bg-[#050b14]/80 border border-[#38bdf8]/15 rounded p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-tabular uppercase tracking-wider text-[#b9cacb]">
                      <Clock className="w-3 h-3 text-[#00f0ff]" />
                      <span>Day Length</span>
                    </div>
                    <div className="font-mono-tabular text-xl font-semibold text-[#dbfcff] mt-1">
                      {interpolatedTelemetry.dayLengthHours.toFixed(1)}
                      <span className="text-xs text-[#849495] ml-1">hrs</span>
                    </div>
                  </div>

                  <div className="bg-[#050b14]/80 border border-[#38bdf8]/15 rounded p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-tabular uppercase tracking-wider text-[#b9cacb]">
                      <Gauge className="w-3 h-3 text-[#38bdf8]" />
                      <span>Surface Press</span>
                    </div>
                    <div className="font-mono-tabular text-lg font-semibold text-[#dbfcff] mt-1">
                      {interpolatedTelemetry.pressureBar.toFixed(2)}
                      <span className="text-xs text-[#849495] ml-1">bar</span>
                    </div>
                  </div>

                  <div className="bg-[#050b14]/80 border border-[#38bdf8]/15 rounded p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-tabular uppercase tracking-wider text-[#b9cacb]">
                      <Sun className="w-3 h-3 text-[#f59e0b]" />
                      <span>Solar Output</span>
                    </div>
                    <div className="font-mono-tabular text-lg font-semibold text-[#dbfcff] mt-1">
                      {interpolatedTelemetry.solarLuminosityPct.toFixed(1)}
                      <span className="text-xs text-[#849495] ml-1">% L☉</span>
                    </div>
                  </div>

                  <div className="bg-[#050b14]/80 border border-[#38bdf8]/15 rounded p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-tabular uppercase tracking-wider text-[#b9cacb]">
                      <Waves className="w-3 h-3 text-[#7bd0ff]" />
                      <span>Sea Level</span>
                    </div>
                    <div className="font-mono-tabular text-base font-semibold text-[#dbfcff] mt-1">
                      {interpolatedTelemetry.seaLevelOffsetM > 0 ? '+' : ''}
                      {Math.round(interpolatedTelemetry.seaLevelOffsetM)}
                      <span className="text-xs text-[#849495] ml-1">m</span>
                    </div>
                  </div>

                  <div className="bg-[#050b14]/80 border border-[#38bdf8]/15 rounded p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-tabular uppercase tracking-wider text-[#b9cacb]">
                      <Shield className="w-3 h-3 text-[#8b5cf6]" />
                      <span>Geodynamo</span>
                    </div>
                    <div className="font-mono-tabular text-base font-semibold text-[#dbfcff] mt-1">
                      {Math.round(interpolatedTelemetry.magneticFieldPct)}
                      <span className="text-xs text-[#849495] ml-1">% mod</span>
                    </div>
                  </div>
                </div>

                {/* Atmospheric Spectroscopy Bars */}
                <div className="pt-2 border-t border-[#38bdf8]/15">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#7bd0ff]">
                      Atmospheric Composition
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 font-mono-tabular text-xs">
                    <div>
                      <div className="flex justify-between text-[#dbe1ff] mb-1">
                        <span>O₂ Oxygen</span>
                        <span className="text-[#00f0ff]">{interpolatedTelemetry.o2Pct.toFixed(2)}%</span>
                      </div>
                      <div className="h-1.5 bg-[#050b14] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00f0ff]"
                          style={{ width: `${Math.min(100, (interpolatedTelemetry.o2Pct / 35) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#dbe1ff] mb-1">
                        <span>CO₂ Carbon Dioxide</span>
                        <span className="text-[#f59e0b]">
                          {interpolatedTelemetry.co2Ppm >= 10000
                            ? `${(interpolatedTelemetry.co2Ppm / 10000).toFixed(1)}%`
                            : `${Math.round(interpolatedTelemetry.co2Ppm).toLocaleString()} ppm`}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#050b14] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#f59e0b]"
                          style={{
                            width: `${Math.min(
                              100,
                              (Math.log10(Math.max(100, interpolatedTelemetry.co2Ppm)) / 6) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#dbe1ff] mb-1">
                        <span>N₂ Nitrogen</span>
                        <span className="text-[#38bdf8]">{interpolatedTelemetry.n2Pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-[#050b14] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#38bdf8]"
                          style={{ width: `${Math.min(100, interpolatedTelemetry.n2Pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Geological Curatorial Brief */}
              <div className="observatory-deck rounded-lg p-4 flex flex-col gap-3 flex-1">
                <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#7bd0ff]">
                  Curatorial Dossier · {activeGeoEpoch.ageSpanLabel}
                </div>
                <h3 className="font-display text-base font-semibold text-[#dbfcff] leading-snug">
                  {activeGeoEpoch.headline}
                </h3>
                <p className="text-xs leading-relaxed text-[#b9cacb]">
                  {activeGeoEpoch.summary}
                </p>

                <div className="pt-2 border-t border-[#38bdf8]/15 mt-auto">
                  <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#849495] mb-2">
                    Field Sites in Epoch
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {activeGeoEpoch.fieldSites.map((site) => {
                      const active = selectedSite?.id === site.id;
                      return (
                        <button
                          key={site.id}
                          type="button"
                          onClick={() => setSelectedSite(active ? null : site)}
                          className={`w-full text-left px-2.5 py-2 rounded border text-xs flex items-center justify-between gap-2 transition-colors ${
                            active
                              ? 'bg-[#00f0ff]/12 border-[#00f0ff] text-[#dbfcff]'
                              : 'bg-[#050b14]/65 border-[#38bdf8]/15 text-[#b9cacb] hover:border-[#38bdf8]/45 hover:text-[#dbe1ff]'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#00f0ff] shrink-0" />
                            <span className="truncate">{site.name}</span>
                          </span>
                          <span className="font-mono-tabular text-[10px] text-[#7bd0ff] shrink-0">
                            {site.ageLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* EXPANDED UPPER-RIGHT INFORMATION PANEL FOR SATELLITE OBSERVATIONS */
            <div className="observatory-deck rounded-lg p-4 flex flex-col gap-3.5 h-full overflow-y-auto max-h-[660px]">
              <div className="flex items-start justify-between gap-2 border-b border-[#38bdf8]/15 pb-3">
                <div>
                  <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#00f0ff]">
                    {selectedSarSite.mission} · {selectedSarSite.phenomenon}
                  </div>
                  <h2 className="font-display text-base font-semibold text-[#dbfcff] mt-0.5 leading-snug">
                    {selectedSarSite.title}
                  </h2>
                  <div className="font-mono-tabular text-[10px] text-[#7bd0ff] mt-0.5">
                    {selectedSarSite.region} · {selectedSarSite.observationDate}
                  </div>
                </div>
                <a
                  href={selectedSarSite.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open Official Dataset Portal"
                  className="p-1.5 rounded border border-[#38bdf8]/25 text-[#7bd0ff] hover:text-[#00f0ff] hover:border-[#00f0ff]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 1. Measured Satellite Observations */}
              <div className="bg-[#050b14]/80 border border-[#00f0ff]/25 rounded p-3">
                <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#00f0ff] mb-1">
                  Measured Satellite Findings
                </div>
                <div className="font-mono-tabular text-[11px] text-[#dbfcff]">
                  {selectedSarSite.wavelength} · {selectedSarSite.measuredObservations.polarization} ·{' '}
                  {selectedSarSite.measuredObservations.resolution}
                </div>
                <p className="text-xs text-[#dbe1ff]/90 mt-1.5 leading-relaxed">
                  {selectedSarSite.measuredObservations.signalBehavior}
                </p>
                <div className="mt-2 pt-2 border-t border-[#38bdf8]/15 text-[11px] text-[#b9cacb]">
                  <span className="text-[#7bd0ff]">Change: </span>
                  {selectedSarSite.measuredObservations.afterSignature}
                </div>
              </div>

              {/* 2. Environmental Conditions & Historical Context */}
              <div className="bg-[#050b14]/65 border border-[#38bdf8]/15 rounded p-3">
                <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#7bd0ff] mb-1">
                  Environmental Conditions & Context
                </div>
                <p className="text-xs text-[#dbe1ff]/90 leading-relaxed">
                  {selectedSarSite.environmentalConditions}
                </p>
                <p className="text-xs text-[#849495] mt-1.5 leading-relaxed">
                  {selectedSarSite.historicalContext}
                </p>
              </div>

              {/* 3. Scientific Interpretation & Consequences */}
              <div className="bg-[#050b14]/65 border border-[#f59e0b]/25 rounded p-3">
                <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#f59e0b] mb-1">
                  Scientific Interpretation & Consequences
                </div>
                <p className="text-xs text-[#dbe1ff]/90 leading-relaxed">
                  {selectedSarSite.scientificInterpretation}
                </p>
                <p className="text-xs text-[#ffd19c]/90 mt-1.5 leading-relaxed">
                  {selectedSarSite.environmentalConsequences}
                </p>
              </div>

              {/* 4. Live ASF/CMR Granule Snippet (if scanned) */}
              {selectedGranule && (
                <div className="bg-[#0a122a] border border-[#00f0ff]/40 rounded p-3 text-[11px] font-mono-tabular">
                  <div className="text-[#00f0ff] uppercase tracking-wider text-[10px]">
                    Active Scanned Granule ({selectedGranule.sourceApi})
                  </div>
                  <div className="text-[#dbfcff] truncate mt-0.5">{selectedGranule.granuleName}</div>
                  <div className="text-[#b9cacb] mt-0.5">
                    {selectedGranule.platform} · {selectedGranule.startTime.slice(0, 10)} ·{' '}
                    {selectedGranule.processingLevel}
                  </div>
                </div>
              )}

              {/* 5. Provenance & Before/After Modal Action */}
              <div className="mt-auto pt-2 border-t border-[#38bdf8]/15 flex flex-col gap-2">
                <div className="text-[10px] font-mono-tabular text-[#849495]">
                  {selectedSarSite.dataSourceLabel}
                </div>
                <button
                  type="button"
                  onClick={onOpenSarComparator}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-mono-tabular uppercase tracking-wider bg-[#00f0ff]/15 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#030712] transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Open Before / After Comparator</span>
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom Time Machine Bar: Geological Scrubber OR Satellite Observation Era Scrubber */}
      {!isSatelliteMode ? (
        <EpochScrubber
          timelinePos={timelinePos}
          onChangePos={onChangeTimelinePos}
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          interpolatedAgeGa={interpolatedAgeGa}
        />
      ) : (
        <section
          aria-label="Satellite Observation Time Scrubber"
          className="observatory-deck rounded-lg px-4 py-3.5 md:px-6 md:py-4 flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#7bd0ff]">
                Satellite Observation Era · Modern SAR Record (1995 – 2026)
              </div>
              <div className="font-display text-base font-semibold text-[#dbfcff] mt-0.5">
                {currentSatEra.mission} — {currentSatEra.milestone}
              </div>
            </div>
            <div className="font-mono-tabular text-lg font-medium text-[#00f0ff]">
              {currentSatEra.label}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {SATELLITE_ERAS.map((era, idx) => {
              const active = idx === satEraIdx;
              return (
                <button
                  key={era.label}
                  type="button"
                  onClick={() => {
                    setSatEraIdx(idx);
                    const match = SAR_OBSERVATIONS.find((s) =>
                      era.mission.toUpperCase().includes(s.mission.split(' ')[0].toUpperCase())
                    );
                    if (match) {
                      onSelectSarSite(match);
                      onFocusCoords(match.lat, match.lon);
                    }
                  }}
                  className={`text-left px-3 py-2 rounded border transition-colors ${
                    active
                      ? 'bg-[#00f0ff]/15 border-[#00f0ff] text-[#dbfcff]'
                      : 'bg-[#050b14]/70 border-[#38bdf8]/20 text-[#b9cacb] hover:border-[#38bdf8]/50'
                  }`}
                >
                  <div className="font-mono-tabular text-xs text-[#00f0ff]">{era.label}</div>
                  <div className="font-display text-xs font-semibold truncate mt-0.5">
                    {era.mission}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
