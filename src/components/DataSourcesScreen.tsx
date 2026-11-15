import React, { useEffect, useState } from 'react';
import { DATA_SOURCES_REGISTRY } from '../data/sarData';
import { ExternalLink, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface CmrCollectionSummary {
  conceptId: string;
  shortName: string;
  title: string;
  timeStart: string | null;
  timeEnd: string;
  dataCenter: string;
  processingLevel: string;
}

export const DataSourcesScreen: React.FC = () => {
  const [cmrCollections, setCmrCollections] = useState<CmrCollectionSummary[]>([]);
  const [cmrLoading, setCmrLoading] = useState(true);
  const [cmrError, setCmrError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadCollections = async () => {
      setCmrLoading(true);
      setCmrError(null);
      try {
        const res = await fetch('/api/sar/collections');
        const data = (await res.json()) as {
          ok: boolean;
          collections?: CmrCollectionSummary[];
          error?: string;
        };
        if (!active) return;
        if (data.ok && data.collections) {
          setCmrCollections(data.collections);
        } else {
          setCmrError(data.error || 'Unable to verify live CMR collections.');
        }
      } catch (err) {
        if (active) {
          setCmrError(err instanceof Error ? err.message : 'Network error reaching NASA CMR.');
        }
      } finally {
        if (active) setCmrLoading(false);
      }
    };
    void loadCollections();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-[1680px] mx-auto px-5 md:px-10 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-[#38bdf8]/20 pb-6">
        <div className="font-mono-tabular text-xs uppercase tracking-[0.12em] text-[#7bd0ff]">
          Scientific Provenance & Open Data Licensing
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-[#dbfcff] mt-1 tracking-tight text-balance">
          Data Sources & Scientific References
        </h1>
        <p className="text-sm text-[#b9cacb] mt-2 max-w-3xl">
          Every dataset, radar catalog, and scientific interpretation integrated into Earth Through Time is attributed below to its originating space agency or archive center. Authentication gates and pre-operational data limitations are reported explicitly.
        </p>
      </div>

      {/* Official Space Apps & Agency Sources Registry */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {DATA_SOURCES_REGISTRY.map((src) => (
          <article
            key={src.id}
            className="observatory-deck observatory-deck-hover rounded-lg p-5 flex flex-col justify-between gap-4"
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#7bd0ff]">
                  {src.organization}
                </div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono-tabular text-[#00f0ff] hover:underline shrink-0"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <h2 className="font-display text-lg font-semibold text-[#dbfcff] leading-snug">
                {src.missionOrDataset}
              </h2>

              <p className="text-xs text-[#dbe1ff]/90 leading-relaxed">
                {src.informationType}
              </p>

              <div className="bg-[#050b14]/75 border border-[#38bdf8]/15 rounded p-3 text-xs flex flex-col gap-1.5">
                <div>
                  <span className="font-mono-tabular text-[10px] uppercase text-[#849495]">
                    Integration in Earth Through Time:{' '}
                  </span>
                  <span className="text-[#b9cacb]">{src.integrationUsage}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#38bdf8]/15 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tabular">
              <span className="text-[#f59e0b]">Period: {src.observationPeriod}</span>
              <span className="text-[#849495]">{src.authRequirement}</span>
            </div>
          </article>
        ))}
      </section>

      {/* Live Verified NASA CMR Collections Catalog */}
      <section className="observatory-deck rounded-lg p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#38bdf8]/15 pb-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-[#00f0ff]" />
            <div>
              <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#7bd0ff]">
                Live NASA CMR Collection Verification (ASF DAAC)
              </div>
              <h2 className="font-display text-lg font-semibold text-[#dbfcff]">
                Active SAR Collections Indexed in NASA Earthdata
              </h2>
            </div>
          </div>

          <div className="font-mono-tabular text-xs flex items-center gap-1.5">
            {cmrLoading ? (
              <span className="text-[#7bd0ff] flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Querying cmr.earthdata.nasa.gov...
              </span>
            ) : cmrError ? (
              <span className="text-[#ffb4ab] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {cmrError}
              </span>
            ) : (
              <span className="text-[#34d399] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {cmrCollections.length} Live CMR Collections Verified
              </span>
            )}
          </div>
        </div>

        {cmrCollections.length > 0 && (
          <div className="overflow-x-auto border border-[#38bdf8]/15 rounded bg-[#050b14]/70">
            <table className="w-full text-left border-collapse text-xs font-mono-tabular">
              <thead>
                <tr className="border-b border-[#38bdf8]/20 text-[10px] uppercase text-[#7bd0ff]">
                  <th className="py-2.5 px-3">Short Name</th>
                  <th className="py-2.5 px-3">Collection Title</th>
                  <th className="py-2.5 px-3">Concept ID</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3">Temporal Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#38bdf8]/10">
                {cmrCollections.map((col) => (
                  <tr key={col.conceptId} className="hover:bg-[#131a33]/60">
                    <td className="py-2 px-3 text-[#00f0ff] font-medium whitespace-nowrap">
                      {col.shortName}
                    </td>
                    <td className="py-2 px-3 font-sans text-[#dbe1ff] max-w-md">{col.title}</td>
                    <td className="py-2 px-3 text-[#849495] whitespace-nowrap">{col.conceptId}</td>
                    <td className="py-2 px-3 text-[#f59e0b] whitespace-nowrap">{col.processingLevel}</td>
                    <td className="py-2 px-3 text-[#b9cacb] whitespace-nowrap">
                      {col.timeStart ? col.timeStart.slice(0, 10) : '—'} to{' '}
                      {col.timeEnd === 'Ongoing' ? 'Ongoing' : col.timeEnd.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
