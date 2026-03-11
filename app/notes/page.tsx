'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
  coreConcepts: { title: string; description: string; citation?: string }[];
  keyTheorists: { name: string; contribution: string }[];
  pdfUrl?: string;
}

export default function NotesListPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/readings')
      .then(r => r.json())
      .then(d => setReadings(d.readings || []))
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [user]);

  return (
    <MobileLayout>
      <div className="px-4 pt-10 pb-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-teal-600 text-sm font-medium mb-5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-5">Reading Materials</h1>

        {fetching ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : readings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No reading materials yet.</div>
        ) : (
          <div className="space-y-3">
            {readings.map(r => (
              <Link
                key={r._id}
                href={`/notes/${r._id}`}
                className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-teal-200 transition-colors"
              >
                <p className="text-xs text-gray-400 mb-1">{r.professorName} · {r.subject}</p>
                <h2 className="font-bold text-gray-900 mb-2">{r.title}</h2>
                <div className="flex gap-2 flex-wrap">
                  <InfoBadge>Week {r.weekNumber}</InfoBadge>
                  <InfoBadge variant="gray">~{r.readingTimeMinutes} min read</InfoBadge>
                  <InfoBadge variant="amber">{r.keyTermsCount} key terms</InfoBadge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
