import { useEffect, useState } from 'react';
import { EARTH_EPOCHS } from './data/earthData';
import {
  SAR_OBSERVATIONS,
  SarObservationSite,
  LiveSarGranule,
  LiveEonetEvent,
} from './data/sarData';
import { TopNav } from './components/TopNav';
import { ObservatoryScreen, ExplorationMode } from './components/ObservatoryScreen';
import { CompareModal } from './components/CompareModal';
import { SarComparatorModal } from './components/SarComparatorModal';

export default function App() {
  const [explorationMode, setExplorationMode] = useState<ExplorationMode>('geological');
  const [timelinePos, setTimelinePos] = useState<number>(7);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [compareOpen, setCompareOpen] = useState<boolean>(false);
  const [sarComparatorOpen, setSarComparatorOpen] = useState<boolean>(false);

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
    }
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
    handleFocusCoords(site.lat, site.lon);
  };

  const currentNearestEpoch = EARTH_EPOCHS[Math.round(timelinePos)] || EARTH_EPOCHS[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-[#dbe1ff]">
      <TopNav onOpenCompare={() => setCompareOpen(true)} />

      <main className="flex-1 flex flex-col">
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
          onOpenSarComparator={() => setSarComparatorOpen(true)}
        />
      </main>

      <CompareModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        initialEpochAId={currentNearestEpoch.id}
        onJumpToEpochId={handleJumpToEpochId}
      />

      <SarComparatorModal
        isOpen={sarComparatorOpen}
        onClose={() => setSarComparatorOpen(false)}
        selectedSarSite={selectedSarSite}
        onSelectSarSite={setSelectedSarSite}
        onProjectOnGlobe={handleProjectSarOnGlobe}
        eonetEvents={eonetEvents}
        earthdataToken={earthdataToken}
        onChangeEarthdataToken={setEarthdataToken}
      />
    </div>
  );
}
