import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  SAR_OBSERVATIONS,
  SAR_PHENOMENON_COLORS,
  SarMission,
  SarObservationSite,
  SarPhenomenon,
  LiveSarGranule,
  LiveEonetEvent,
} from '../data/sarData';
import {
  X,
  Radar,
  Globe,
  ExternalLink,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';

interface SarComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSarSite: SarObservationSite;
  onSelectSarSite: (site: SarObservationSite) => void;
  onProjectOnGlobe: (site: SarObservationSite, granules?: LiveSarGranule[]) => void;
  eonetEvents: LiveEonetEvent[];
  earthdataToken: string;
  onChangeEarthdataToken: (token: string) => void;
}

const MISSION_FILTERS: Array<'All' | SarMission> = [
  'All',
  'NISAR',
  'UAVSAR',
  'Sentinel-1',
  'ALOS PALSAR',
  'RADARSAT / RCM',
  'SAOCOM',
];

const PHENOMENON_FILTERS: Array<'All' | SarPhenomenon> = [
  'All',
  'Flooding',
  'Vegetation',
  'Wildfire',
  'Deformation',
  'Glacier',
];

export const SarComparatorModal: React.FC<SarComparatorModalProps> = ({
  isOpen,
  onClose,
  selectedSarSite,
  onSelectSarSite,
  onProjectOnGlobe,
  eonetEvents,
  earthdataToken,
  onChangeEarthdataToken,
}) => {
  const [missionFilter, setMissionFilter] = useState<'All' | SarMission>('All');
  const [phenomFilter, setPhenomFilter] = useState<'All' | SarPhenomenon>('All');

  const [liveGranules, setLiveGranules] = useState<LiveSarGranule[]>([]);
  const [beforeGranule, setBeforeGranule] = useState<LiveSarGranule | null>(null);
  const [afterGranule, setAfterGranule] = useState<LiveSarGranule | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveStatusNote, setLiveStatusNote] = useState<string | null>(null);
  const [splitPct, setSplitPct] = useState<number>(50);

  const [showAuthBox, setShowAuthBox] = useState(false);
  const [tokenInput, setTokenInput] = useState(earthdataToken);
  const [tokenStatus, setTokenStatus] = useState<{ valid: boolean; message: string } | null>(null);
  const [verifyingToken, setVerifyingToken] = useState(false);

  const [customLat, setCustomLat] = useState(selectedSarSite.lat.toFixed(2));
  const [customLon, setCustomLon] = useState(selectedSarSite.lon.toFixed(2));
  const [customPlatform, setCustomPlatform] = useState<string>(selectedSarSite.asfQuery.platform);

  const filteredSites = useMemo(() => {
    return SAR_OBSERVATIONS.filter((s) => {
      const mOk = missionFilter === 'All' || s.mission === missionFilter;
      const pOk = phenomFilter === 'All' || s.phenomenon === phenomFilter;
      return mOk && pOk;
    });
  }, [missionFilter, phenomFilter]);

  const fetchObservationPair = useCallback(
    async (site: SarObservationSite) => {
      setLoadingLive(true);
      setLiveStatusNote(null);
      setBeforeGranule(null);
      setAfterGranule(null);

      const headers: Record<string, string> = {};
      if (earthdataToken.trim()) {
        headers['x-earthdata-token'] = earthdataToken.trim();
      }

      try {
        const beforeParams = new URLSearchParams({
          lat: String(site.lat),
          lon: String(site.lon),
          radiusDeg: String(site.asfQuery.radiusDeg),
          platform: site.asfQuery.platform,
          start: site.asfQuery.beforeStart,
          end: site.asfQuery.beforeEnd,
          maxResults: '5',
        });

        const afterParams = new URLSearchParams({
          lat: String(site.lat),
          lon: String(site.lon),
          radiusDeg: String(site.asfQuery.radiusDeg),
          platform: site.asfQuery.platform,
          start: site.asfQuery.afterStart,
          end: site.asfQuery.afterEnd,
          maxResults: '6',
        });

        const [bRes, aRes] = await Promise.all([
          fetch(`/api/sar/search?${beforeParams.toString()}`, { headers }),
          fetch(`/api/sar/search?${afterParams.toString()}`, { headers }),
        ]);

        const bJson = (await bRes.json()) as {
          ok: boolean;
          granules: LiveSarGranule[];
          upstreamNotes?: string[];
        };
        const aJson = (await aRes.json()) as {
          ok: boolean;
          granules: LiveSarGranule[];
          upstreamNotes?: string[];
        };

        const bList = bJson.granules || [];
        const aList = aJson.granules || [];
        const combined = [...aList, ...bList];

        setLiveGranules(combined);
        setBeforeGranule(bList.find((g) => g.browseUrls.length > 0) || bList[0] || null);
        setAfterGranule(aList.find((g) => g.browseUrls.length > 0) || aList[0] || null);

        if (combined.length > 0) {
          setLiveStatusNote(
            `Retrieved ${combined.length} real SAR granules (${aList.length} post-event, ${bList.length} baseline) from ASF Search & NASA CMR.`
          );
        } else {
          const notes = [...(aJson.upstreamNotes || []), ...(bJson.upstreamNotes || [])];
          setLiveStatusNote(
            notes[0] ||
              'No public granules returned for this exact temporal window; adjust coordinates or platform to query ASF/CMR.'
          );
        }
      } catch (err) {
        setLiveStatusNote(
          err instanceof Error ? err.message : 'Unable to reach backend /api/sar/search proxy.'
        );
      } finally {
        setLoadingLive(false);
      }
    },
    [earthdataToken]
  );

  useEffect(() => {
    if (!isOpen) return;
    setCustomLat(selectedSarSite.lat.toFixed(2));
    setCustomLon(selectedSarSite.lon.toFixed(2));
    setCustomPlatform(selectedSarSite.asfQuery.platform);
    void fetchObservationPair(selectedSarSite);
  }, [isOpen, selectedSarSite, fetchObservationPair]);

  if (!isOpen) return null;

  const handleCustomQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLive(true);
    setLiveStatusNote(null);
    const headers: Record<string, string> = {};
    if (earthdataToken.trim()) headers['x-earthdata-token'] = earthdataToken.trim();

    try {
      const params = new URLSearchParams({
        lat: customLat,
        lon: customLon,
        radiusDeg: '2.0',
        platform: customPlatform,
        maxResults: '10',
      });
      const res = await fetch(`/api/sar/search?${params.toString()}`, { headers });
      const data = (await res.json()) as {
        ok: boolean;
        granules: LiveSarGranule[];
        upstreamNotes?: string[];
      };
      const list = data.granules || [];
      setLiveGranules(list);
      if (list.length >= 2) {
        setAfterGranule(list[0]);
        setBeforeGranule(list[list.length - 1]);
      } else if (list.length === 1) {
        setAfterGranule(list[0]);
        setBeforeGranule(null);
      }
      setLiveStatusNote(
        list.length > 0
          ? `Live query returned ${list.length} ${customPlatform} granules near (${customLat}°, ${customLon}°).`
          : data.upstreamNotes?.[0] || 'No granules found for that coordinate & platform.'
      );
    } catch (err) {
      setLiveStatusNote(err instanceof Error ? err.message : 'Live query failed.');
    } finally {
      setLoadingLive(false);
    }
  };

  const handleVerifyToken = async () => {
    setVerifyingToken(true);
    setTokenStatus(null);
    try {
      const res = await fetch('/api/sar/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });
      const data = (await res.json()) as { valid: boolean; message: string };
      setTokenStatus(data);
      if (data.valid) {
        onChangeEarthdataToken(tokenInput.trim());
      }
    } catch {
      setTokenStatus({ valid: false, message: 'Network error validating token.' });
    } finally {
      setVerifyingToken(false);
    }
  };

  const beforeBrowseSrc =
    beforeGranule?.browseUrls[0]
      ? `/api/sar/browse?url=${encodeURIComponent(beforeGranule.browseUrls[0])}`
      : null;
  const afterBrowseSrc =
    afterGranule?.browseUrls[0]
      ? `/api/sar/browse?url=${encodeURIComponent(afterGranule.browseUrls[0])}`
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SAR Before and After Radar Comparator"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="observatory-inspect reticle-frame rounded-lg max-w-6xl w-full p-5 md:p-6 flex flex-col gap-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#38bdf8]/20 pb-4">
          <div>
            <div className="font-mono-tabular text-[11px] uppercase tracking-[0.12em] text-[#7bd0ff]">
              Orbital Synthetic Aperture Radar Comparator · ASF & NASA CMR
            </div>
            <h2 className="font-display text-2xl font-bold text-[#dbfcff] mt-0.5">
              Before / After SAR Observations
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowAuthBox((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded text-xs font-mono-tabular uppercase tracking-wider bg-[#050b14] border border-[#38bdf8]/35 text-[#dbe1ff] hover:border-[#00f0ff] transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>{earthdataToken ? 'Earthdata Token Active' : 'Earthdata Login'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onProjectOnGlobe(selectedSarSite, liveGranules);
                onClose();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded text-xs font-mono-tabular uppercase tracking-wider bg-[#00f0ff]/15 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#030712] transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Project on 3D Globe</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close SAR comparator modal"
              className="p-2 rounded text-[#b9cacb] hover:text-[#00f0ff] hover:bg-[#212942] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Session-Only Earthdata Token Drawer */}
        {showAuthBox && (
          <div className="observatory-deck rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-[#f59e0b]/40">
            <div className="max-w-xl">
              <div className="font-mono-tabular text-xs uppercase tracking-wider text-[#f59e0b]">
                NASA Earthdata Login Bearer Token (Session-Only)
              </div>
              <p className="text-xs text-[#b9cacb] mt-1">
                Public ASF GeoJSON searches and Sentinel-1/ALOS browse imagery work without login. Supply a Bearer token only if inspecting gated L2 products; tokens stay in memory only.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste Earthdata Bearer token..."
                aria-label="NASA Earthdata Bearer Token"
                className="px-3 py-2 rounded bg-[#050b14] border border-[#38bdf8]/30 text-xs font-mono-tabular text-[#dbe1ff] w-full sm:w-56 focus:outline-none focus:border-[#00f0ff]"
              />
              <button
                type="button"
                onClick={handleVerifyToken}
                disabled={verifyingToken || !tokenInput.trim()}
                className="px-3.5 py-2 rounded text-xs font-mono-tabular uppercase tracking-wider bg-[#00f0ff]/15 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#030712] disabled:opacity-50"
              >
                {verifyingToken ? 'Verifying...' : 'Verify'}
              </button>
              {earthdataToken && (
                <button
                  type="button"
                  onClick={() => {
                    setTokenInput('');
                    onChangeEarthdataToken('');
                    setTokenStatus(null);
                  }}
                  className="px-3 py-2 rounded text-xs font-mono-tabular text-[#ffb4ab] border border-[#ffb4ab]/30 hover:bg-[#ffb4ab]/10"
                >
                  Clear
                </button>
              )}
            </div>
            {tokenStatus && (
              <div
                className={`text-xs font-mono-tabular flex items-center gap-1.5 ${
                  tokenStatus.valid ? 'text-[#34d399]' : 'text-[#ffb4ab]'
                }`}
              >
                {tokenStatus.valid ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{tokenStatus.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Mission & Phenomenon Filter Ribbons */}
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <div className="flex items-center gap-1 p-1 rounded bg-[#050b14] border border-[#38bdf8]/20 overflow-x-auto">
            {MISSION_FILTERS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMissionFilter(m)}
                className={`px-2.5 py-1 rounded text-xs font-mono-tabular transition-colors whitespace-nowrap shrink-0 ${
                  missionFilter === m
                    ? 'bg-[#00f0ff]/18 text-[#00f0ff] border border-[#00f0ff]/50'
                    : 'text-[#b9cacb] hover:text-[#dbe1ff] border border-transparent'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded bg-[#050b14] border border-[#38bdf8]/20 overflow-x-auto">
            {PHENOMENON_FILTERS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPhenomFilter(p)}
                className={`px-2.5 py-1 rounded text-xs font-mono-tabular transition-colors whitespace-nowrap shrink-0 ${
                  phenomFilter === p
                    ? 'bg-[#38bdf8]/20 text-[#dbfcff] border border-[#38bdf8]/60'
                    : 'text-[#b9cacb] hover:text-[#dbe1ff] border border-transparent'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Main Modal Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Site Selector + Live ASF/CMR Query */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#050b14]/75 border border-[#38bdf8]/20 rounded-lg p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-mono-tabular uppercase text-[#7bd0ff] pb-1.5 border-b border-[#38bdf8]/15">
                <span>Observation Studies</span>
                <span className="text-[#00f0ff]">{filteredSites.length} Sites</span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-1">
                {filteredSites.map((site) => {
                  const isSel = selectedSarSite.id === site.id;
                  const dotColor = SAR_PHENOMENON_COLORS[site.phenomenon];
                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => onSelectSarSite(site)}
                      className={`w-full text-left p-2.5 rounded border transition-all flex flex-col gap-1 ${
                        isSel
                          ? 'bg-[#00f0ff]/12 border-[#00f0ff]'
                          : 'bg-[#0a122a]/55 border-[#38bdf8]/15 hover:border-[#38bdf8]/45'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono-tabular uppercase">
                        <span className="flex items-center gap-1.5 text-[#7bd0ff]">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: dotColor }}
                          />
                          {site.mission} · {site.phenomenon}
                        </span>
                        <span className="text-[#849495]">{site.year}</span>
                      </div>
                      <div className="font-display text-xs font-semibold text-[#dbfcff]">
                        {site.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={handleCustomQuery}
              className="bg-[#050b14]/75 border border-[#38bdf8]/20 rounded-lg p-3.5 flex flex-col gap-3"
            >
              <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#7bd0ff]">
                Live ASF Vertex & NASA CMR Query
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono-tabular text-[10px] uppercase text-[#849495] mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="-85"
                    max="85"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-[#030712] border border-[#38bdf8]/25 text-xs font-mono-tabular text-[#dbe1ff] focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
                <div>
                  <label className="block font-mono-tabular text-[10px] uppercase text-[#849495] mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="-180"
                    max="180"
                    value={customLon}
                    onChange={(e) => setCustomLon(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-[#030712] border border-[#38bdf8]/25 text-xs font-mono-tabular text-[#dbe1ff] focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
              </div>

              <select
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                aria-label="SAR Platform or Catalog"
                className="w-full px-2.5 py-2 rounded bg-[#030712] border border-[#38bdf8]/25 text-xs font-mono-tabular text-[#dbe1ff] focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="SENTINEL-1">Sentinel-1 (C-Band ASF)</option>
                <option value="UAVSAR">UAVSAR (L-Band Airborne JPL/ASF)</option>
                <option value="ALOS">ALOS PALSAR (L-Band ASF)</option>
                <option value="RADARSAT-1">RADARSAT-1 (C-Band CSA/ASF)</option>
                <option value="NISAR">NISAR (L/S-Band NASA CMR)</option>
              </select>

              <button
                type="submit"
                disabled={loadingLive}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-mono-tabular uppercase tracking-wider bg-[#00f0ff]/15 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#030712] disabled:opacity-50 transition-colors"
              >
                {loadingLive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Radar className="w-3.5 h-3.5" />
                )}
                <span>{loadingLive ? 'Querying ASF & CMR...' : 'Query Live Granules'}</span>
              </button>

              {eonetEvents.length > 0 && (
                <div className="pt-2 border-t border-[#38bdf8]/15">
                  <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#f59e0b] mb-1.5">
                    NASA EONET Hazard Quick-Picks
                  </div>
                  <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                    {eonetEvents.slice(0, 5).map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => {
                          setCustomLat(ev.lat.toFixed(2));
                          setCustomLon(ev.lon.toFixed(2));
                          setCustomPlatform('SENTINEL-1');
                        }}
                        className="text-left px-2 py-1 rounded bg-[#0a122a]/70 border border-[#38bdf8]/10 hover:border-[#f59e0b]/50 text-[11px] flex items-center justify-between gap-2"
                      >
                        <span className="truncate text-[#dbe1ff]">{ev.title}</span>
                        <span className="font-mono-tabular text-[10px] text-[#f59e0b] shrink-0">
                          {ev.category.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Column: Before/After Comparator & Discovered Granules */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-[#050b14]/80 border border-[#38bdf8]/20 rounded-lg p-4 flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#38bdf8]/15 pb-3">
                <div>
                  <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#7bd0ff]">
                    {selectedSarSite.mission} · {selectedSarSite.phenomenon} ·{' '}
                    {selectedSarSite.observationDate}
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#dbfcff] mt-0.5">
                    {selectedSarSite.title}
                  </h3>
                  <div className="font-mono-tabular text-[11px] text-[#b9cacb]">
                    {selectedSarSite.datasetName} ·{' '}
                    {selectedSarSite.measuredObservations.polarization} ·{' '}
                    {selectedSarSite.measuredObservations.resolution}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fetchObservationPair(selectedSarSite)}
                    disabled={loadingLive}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#38bdf8]/30 text-xs font-mono-tabular text-[#00f0ff] hover:border-[#00f0ff] disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingLive ? 'animate-spin' : ''}`} />
                    <span>Refresh Pair</span>
                  </button>
                  <a
                    href={selectedSarSite.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#38bdf8]/30 text-xs font-mono-tabular text-[#7bd0ff] hover:border-[#00f0ff] hover:text-[#00f0ff]"
                  >
                    <span>Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {liveStatusNote && (
                <div className="text-xs font-mono-tabular text-[#7bd0ff] bg-[#0a122a] border border-[#38bdf8]/20 rounded px-3 py-2">
                  {liveStatusNote}
                </div>
              )}

              {/* Split Curtain Quicklook Comparison OR Dual Cards */}
              {beforeBrowseSrc && afterBrowseSrc ? (
                <div className="flex flex-col gap-3">
                  <div className="relative w-full h-[260px] rounded overflow-hidden border border-[#38bdf8]/25 bg-[#030712]">
                    <img
                      src={afterBrowseSrc}
                      alt={`Post-event SAR browse for ${selectedSarSite.title}`}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${splitPct}%` }}
                    >
                      <img
                        src={beforeBrowseSrc}
                        alt={`Baseline pre-event SAR browse for ${selectedSarSite.title}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover max-w-none"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-[#00f0ff] shadow-[0_0_12px_#00f0ff]"
                      style={{ left: `${splitPct}%` }}
                    />
                    <div className="absolute top-2.5 left-3 px-2 py-0.5 rounded bg-[#030712]/85 border border-[#38bdf8]/40 font-mono-tabular text-[10px] text-[#dbe1ff]">
                      BEFORE · {beforeGranule?.startTime.slice(0, 10) || selectedSarSite.beforeDate}
                    </div>
                    <div className="absolute top-2.5 right-3 px-2 py-0.5 rounded bg-[#030712]/85 border border-[#00f0ff]/60 font-mono-tabular text-[10px] text-[#00f0ff]">
                      AFTER · {afterGranule?.startTime.slice(0, 10) || selectedSarSite.afterDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#00f0ff]" />
                    <span className="font-mono-tabular text-[10px] uppercase text-[#849495]">
                      Compare Curtain
                    </span>
                    <input
                      type="range"
                      min={5}
                      max={95}
                      value={splitPct}
                      onChange={(e) => setSplitPct(Number(e.target.value))}
                      aria-label="Slide before and after radar observation curtain"
                      className="flex-1 accent-[#00f0ff]"
                    />
                    <span className="font-mono-tabular text-xs text-[#00f0ff]">{splitPct}%</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      tag: 'Baseline Acquisition',
                      date: beforeGranule?.startTime.slice(0, 10) || selectedSarSite.beforeDate,
                      granule: beforeGranule,
                      sig: selectedSarSite.measuredObservations.beforeSignature,
                    },
                    {
                      tag: 'Change Detection Acquisition',
                      date: afterGranule?.startTime.slice(0, 10) || selectedSarSite.afterDate,
                      granule: afterGranule,
                      sig: selectedSarSite.measuredObservations.afterSignature,
                    },
                  ].map((panel, i) => (
                    <div
                      key={i}
                      className="rounded border border-[#38bdf8]/20 bg-[#0a122a]/70 p-3 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between font-mono-tabular text-[10px] uppercase">
                        <span className="text-[#7bd0ff]">{panel.tag}</span>
                        <span className="text-[#00f0ff]">{panel.date}</span>
                      </div>
                      {panel.granule?.browseUrls[0] ? (
                        <img
                          src={`/api/sar/browse?url=${encodeURIComponent(panel.granule.browseUrls[0])}`}
                          alt={`${panel.tag} SAR quicklook`}
                          referrerPolicy="no-referrer"
                          className="w-full h-36 object-cover rounded border border-[#38bdf8]/20 bg-[#030712]"
                        />
                      ) : (
                        <div className="w-full h-24 rounded border border-dashed border-[#38bdf8]/25 bg-[#030712]/70 flex items-center justify-center px-3 text-center">
                          <span className="font-mono-tabular text-[11px] text-[#849495]">
                            {loadingLive
                              ? 'Querying ASF quicklook imagery...'
                              : 'Browse PNG requires Earthdata auth or outside current ASF public quicklook window'}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-[#dbe1ff] leading-relaxed">{panel.sig}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discovered Granules Table */}
            <div className="bg-[#050b14]/80 border border-[#38bdf8]/20 rounded-lg p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="font-display text-sm font-semibold text-[#dbfcff]">
                  Discovered Satellite Granules ({liveGranules.length})
                </div>
                {liveGranules.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onProjectOnGlobe(selectedSarSite, liveGranules);
                      onClose();
                    }}
                    className="text-xs font-mono-tabular text-[#00f0ff] hover:underline"
                  >
                    Overlay Swaths on Globe
                  </button>
                )}
              </div>

              {liveGranules.length === 0 ? (
                <div className="text-xs text-[#849495] py-2">
                  {loadingLive
                    ? 'Contacting Alaska Satellite Facility & NASA CMR...'
                    : 'No granules loaded yet for this query window.'}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-48 border border-[#38bdf8]/15 rounded bg-[#030712]/80">
                  <table className="w-full text-left border-collapse text-xs font-mono-tabular">
                    <thead>
                      <tr className="border-b border-[#38bdf8]/20 text-[10px] uppercase text-[#7bd0ff]">
                        <th className="py-2 px-3">Granule ID</th>
                        <th className="py-2 px-3">Platform / Band</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#38bdf8]/10">
                      {liveGranules.slice(0, 8).map((g) => (
                        <tr key={g.id} className="hover:bg-[#131a33]/60">
                          <td className="py-1.5 px-3 text-[#dbfcff] max-w-[220px] truncate" title={g.granuleName}>
                            {g.granuleName}
                          </td>
                          <td className="py-1.5 px-3 text-[#b9cacb]">
                            {g.platform} · {g.band}
                          </td>
                          <td className="py-1.5 px-3 text-[#dbe1ff]">
                            {g.startTime ? g.startTime.slice(0, 10) : 'N/A'}
                          </td>
                          <td className="py-1.5 px-3 text-[#00f0ff]">{g.sourceApi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
