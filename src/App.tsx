import { useEffect, useState } from 'react';
import { EARTH_EPOCHS } from './data/earthData';
import {
  SAR_OBSERVATIONS,
  SarObservationSite,
  LiveSarGranule,
  LiveEonetEvent,
} from './data/sarData';
import { TopNav, AppScreen } from './components/TopNav';
import { ObservatoryScreen, ExplorationMode } from './components/ObservatoryScreen';
import { ChronologyScreen } from './components/ChronologyScreen';
import { SpectroscopyScreen } from './components/SpectroscopyScreen';
import { SpecimensScreen } from './components/SpecimensScreen';
import { SatelliteObservationsScreen } from './components/SatelliteObservationsScreen';
import { DataSourcesScreen } from './components/DataSourcesScreen';
import { CompareModal } from './components/CompareModal';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>('observatory');
  const [explorationMode, setExplorationMode] = useState<ExplorationMode>('geological');
  const [timelinePos, setTimelinePos] = useState<number>(7);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [compareOpen, setCompareOpen] = useState<boolean>(false);

  // Satellite Observation shared state
  const [selectedSarSite, setSelectedSarSite] = useState<SarObservationSite>(SAR_OBSERVATIONS[1]);
  const [liveGranules, setLiveGranules] = useState<LiveSarGranule[]>([]);
  const [eonetEvents, setEonetEvents] = useState<LiveEonetEvent[]>([]);
  const [earthdataToken, setEarthdataToken] = useState<string>('');
  const [focusTarget, setFocusTarget] = useState<{
    lat: number;
    lon: number;
    nonce: number;
  } | null>(null);

  // Fetch live NASA EONET v3 hazard events once for satellite mode globe markers
  useEffect(() => {
    let active = true;
    fetch('/api/sar/events')
      .then((res) => res.json())
      .then((data: { ok?: boolean; events?: LiveEonetEvent[] }) => {
        if (active && data.ok && Array.isArray(data.events)) {
          setEonetEvents(data.events);
        }
      })
      .catch(() => {
        // Non-fatal if EONET is unreachable offline
      });
    return () => {
      active = false;
    };
  }, []);

  // Smooth chronological sweep playback when in Geological Time
  useEffect(() => {
    if (!isPlaying || explorationMode !== 'geological') return;
    const maxIdx = EARTH_EPOCHS.length - 1;
    let rafId: number;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      setTimelinePos((prev) => {
        const next = prev + dt * 0.42;
        if (next >= maxIdx) {
          return 0;
        }
        return next;
      });
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, explorationMode]);

  const handleJumpToEpochId = (epochId: string) => {
    const idx = EARTH_EPOCHS.findIndex((e) => e.id === epochId);
    if (idx !== -1) {
      setIsPlaying(false);
      setExplorationMode('geological');
      setTimelinePos(idx);
      setActiveScreen('observatory');
    }
  };

  const handleLaunchIndexInObservatory = (idx: number) => {
    setIsPlaying(false);
    setExplorationMode('geological');
    setTimelinePos(Math.max(0, Math.min(EARTH_EPOCHS.length - 1, idx)));
    setActiveScreen('observatory');
  };

  const handleFocusCoords = (lat: number, lon: number) => {
    setFocusTarget({ lat, lon, nonce: Date.now() });
  };

  const handleProjectSarOnGlobe = (site: SarObservationSite, granules?: LiveSarGranule[]) => {
    setSelectedSarSite(site);
    if (granules && granules.length > 0) {
      setLiveGranules(granules);
    }
    setIsPlaying(false);
    setExplorationMode('satellite');
    setActiveScreen('observatory');
    handleFocusCoords(site.lat, site.lon);
  };

  const currentNearestEpoch = EARTH_EPOCHS[Math.round(timelinePos)] || EARTH_EPOCHS[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-[#dbe1ff]">
      <TopNav
        activeScreen={activeScreen}
        onChangeScreen={setActiveScreen}
        onOpenCompare={() => setCompareOpen(true)}
      />

      <main className="flex-1">
        {activeScreen === 'observatory' && (
          <ObservatoryScreen
            explorationMode={explorationMode}
            onChangeMode={(mode) => {
              setIsPlaying(false);
              setExplorationMode(mode);
              if (mode === 'satellite') {
                handleFocusCoords(selectedSarSite.lat, selectedSarSite.lon);
              }
            }}
            timelinePos={timelinePos}
            onChangeTimelinePos={(pos) => {
              setIsPlaying(false);
              setTimelinePos(pos);
            }}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            selectedSarSite={selectedSarSite}
            onSelectSarSite={setSelectedSarSite}
            liveGranules={liveGranules}
            onUpdateLiveGranules={setLiveGranules}
            eonetEvents={eonetEvents}
            earthdataToken={earthdataToken}
            focusTarget={focusTarget}
            onFocusCoords={handleFocusCoords}
            onOpenSpectroscopy={() => setActiveScreen('spectroscopy')}
            onOpenChronology={() => setActiveScreen('chronology')}
            onOpenSatelliteScreen={() => setActiveScreen('satellite')}
            onOpenSourcesScreen={() => setActiveScreen('sources')}
          />
        )}

        {activeScreen === 'satellite' && (
          <SatelliteObservationsScreen
            selectedSarSite={selectedSarSite}
            onSelectSarSite={setSelectedSarSite}
            onProjectOnGlobe={handleProjectSarOnGlobe}
            eonetEvents={eonetEvents}
            earthdataToken={earthdataToken}
            onChangeEarthdataToken={setEarthdataToken}
          />
        )}

        {activeScreen === 'chronology' && (
          <ChronologyScreen
            activeEpochIndex={timelinePos}
            onLaunchInObservatory={handleLaunchIndexInObservatory}
          />
        )}

        {activeScreen === 'spectroscopy' && (
          <SpectroscopyScreen onJumpToEpochId={handleJumpToEpochId} />
        )}

        {activeScreen === 'specimens' && (
          <SpecimensScreen onJumpToEpochId={handleJumpToEpochId} />
        )}

        {activeScreen === 'sources' && <DataSourcesScreen />}
      </main>

      <footer className="border-t border-[#38bdf8]/15 bg-[#050b14]/70 mt-auto">
        <div className="max-w-[1680px] mx-auto px-5 md:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#849495]">
          <div className="font-mono-tabular">
            Earth Through Time · Deep-Time Geology & NASA/ASF SAR Observatory
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveScreen('satellite')}
              className="hover:text-[#dbe1ff] transition-colors"
            >
              Satellite Observations
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('chronology')}
              className="hover:text-[#dbe1ff] transition-colors"
            >
              Chronology
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('sources')}
              className="hover:text-[#dbe1ff] transition-colors"
            >
              Data Sources & References
            </button>
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              className="text-[#00f0ff] hover:underline"
            >
              Compare Epochs
            </button>
          </div>
        </div>
      </footer>

      <CompareModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        initialEpochAId={currentNearestEpoch.id}
        onJumpToEpochId={handleJumpToEpochId}
      />
    </div>
  );
}
