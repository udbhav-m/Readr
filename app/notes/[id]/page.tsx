'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Puzzle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MobileLayout } from '@/components/MobileLayout';
import { InfoBadge } from '@/components/InfoBadge';

interface Reading {
  _id: string;
  title: string;
  professorName: string;
  subject: string;
  weekNumber: number;
  readingTimeMinutes: number;
  keyTermsCount: number;
  summaryContent: string;
  coreConcepts: { title: string; description: string; citation?: string }[];
  keyTheorists: { name: string; contribution: string }[];
  pdfUrl?: string;
}

export default function NotesDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [reading, setReading] = useState<Reading | null>(null);
  const [tab, setTab] = useState<'summary' | 'pdf'>('summary');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !params.id) return;
    fetch(`/api/readings/${params.id}`)
      .then(r => r.json())
      .then(d => setReading(d.reading))
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [user, params.id]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!reading) {
    return (
      <MobileLayout>
        <div className="px-4 pt-10">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-teal-600 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <p className="text-gray-400 text-center mt-12">Reading material not found.</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-4 pt-10 pb-4">
        {/* Header */}
        <button onClick={() => router.back()} className="flex items-center gap-1 text-teal-600 text-sm font-medium mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <p className="text-xs text-gray-400 mb-1">{reading.professorName} · {reading.subject}</p>
        <h1 className="text-xl font-bold text-gray-900 mb-3">{reading.title}</h1>

        <div className="flex gap-2 mb-4 flex-wrap">
          <InfoBadge>Week {reading.weekNumber}</InfoBadge>
          <InfoBadge variant="gray">~{reading.readingTimeMinutes} min read</InfoBadge>
          <InfoBadge variant="amber">{reading.keyTermsCount} key terms</InfoBadge>
        </div>

        {/* Toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5">
          {(['summary', 'pdf'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {t === 'pdf' ? (reading?.pdfUrl ? 'Full PDF' : 'Full Notes') : 'Summary'}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'summary' ? (
          <div className="space-y-4">
            {reading.coreConcepts && reading.coreConcepts.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-3">Core Concept</h2>
                <div className="space-y-3">
                  {reading.coreConcepts.map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">{c.title}</span>
                        <span className="text-gray-600 text-sm"> — {c.description}</span>
                        {c.citation && <p className="text-xs text-gray-400 italic mt-0.5">{c.citation}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {reading.keyTheorists && reading.keyTheorists.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-3">Key Theorists</h2>
                <div className="space-y-2">
                  {reading.keyTheorists.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">{t.name}</span> — {t.contribution}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(!reading.coreConcepts?.length && !reading.keyTheorists?.length) && (
              <p className="text-sm text-gray-400 text-center py-8">No summary content available.</p>
            )}
          </div>
        ) : (
          reading.pdfUrl ? (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100" style={{ height: '65vh' }}>
              <iframe src={reading.pdfUrl} className="w-full h-full" title="PDF Viewer" />
            </div>
          ) : (
            <div className="space-y-5 pb-28">
              {/* Full summary text */}
              {reading.summaryContent && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h2 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Overview</h2>
                  <p className="text-sm text-gray-700 leading-relaxed">{reading.summaryContent}</p>
                </div>
              )}

              {/* Full core concepts with complete descriptions */}
              {reading.coreConcepts && reading.coreConcepts.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h2 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-3">Core Concepts</h2>
                  <div className="space-y-4">
                    {reading.coreConcepts.map((c, i) => (
                      <div key={i} className="border-l-2 border-teal-400 pl-3">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">{c.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{c.description}</p>
                        {c.citation && (
                          <p className="text-xs text-teal-600 mt-1 font-medium">— {c.citation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full key theorists with contributions */}
              {reading.keyTheorists && reading.keyTheorists.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h2 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-3">Key Theorists</h2>
                  <div className="space-y-3">
                    {reading.keyTheorists.map((t, i) => (
                      <div key={i} className="border-l-2 border-amber-400 pl-3">
                        <h3 className="font-semibold text-gray-900 text-sm">{t.name}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{t.contribution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata footer */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                  <span>Week {reading.weekNumber}</span>
                  <span>~{reading.readingTimeMinutes} min read</span>
                  <span>{reading.keyTermsCount} key terms</span>
                  <span>{reading.professorName}</span>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Create Puzzle Button - fixed above bottom nav */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
        <button
          onClick={() => router.push(`/puzzle/create?readingId=${reading._id}`)}
          className="w-full bg-teal-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg hover:bg-teal-700 flex items-center justify-center gap-2"
        >
          <Puzzle className="w-4 h-4" />
          Create a Puzzle from This
        </button>
      </div>
    </MobileLayout>
  );
}
