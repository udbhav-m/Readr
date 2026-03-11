'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MobileLayout } from '@/components/MobileLayout';

interface Reading {
  _id: string;
  title: string;
  weekNumber: number;
}

function CreatePuzzleInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const readingIdFromQuery = searchParams.get('readingId') || '';

  const [readings, setReadings] = useState<Reading[]>([]);
  const [form, setForm] = useState({
    title: '',
    readingMaterialId: readingIdFromQuery,
    puzzleType: 'wordle',
    solutionWord: '',
    clue: '',
    maxAttempts: 6,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/readings')
      .then(r => r.json())
      .then(d => setReadings(d.readings || []))
      .catch(console.error);
  }, [user]);

  function update(key: string, val: string | number) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.title || !form.readingMaterialId || !form.solutionWord || !form.clue) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.solutionWord.length < 3 || form.solutionWord.length > 10) {
      setError('Answer word must be between 3 and 10 letters.');
      return;
    }
    if (/\s/.test(form.solutionWord)) {
      setError('Answer word cannot contain spaces.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create puzzle');
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create puzzle');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <MobileLayout>
        <div className="px-4 pt-20 pb-4 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Puzzle Created!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your puzzle has been assigned to a random classmate. You earned <strong className="text-teal-600">+30 points</strong>!
          </p>
          <button
            onClick={() => router.push('/home')}
            className="bg-teal-600 text-white py-3 px-8 rounded-2xl font-semibold text-sm hover:bg-teal-700"
          >
            Back to Home
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-4 pt-10 pb-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-teal-600 text-sm font-medium mb-5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Create a Puzzle</h1>
        <p className="text-xs text-gray-400 mb-5">Your puzzle will be assigned to a random classmate.</p>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-2xl px-4 py-3 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reading Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reading Material *</label>
            <select
              value={form.readingMaterialId}
              onChange={e => update('readingMaterialId', e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Select a reading...</option>
              {readings.map(r => (
                <option key={r._id} value={r._id}>Week {r.weekNumber} — {r.title}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Puzzle Title *</label>
            <input
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="e.g. Guess the concept"
              required
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Answer Word */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Answer Word * (no spaces, 3-10 letters)</label>
            <input
              value={form.solutionWord}
              onChange={e => update('solutionWord', e.target.value.toUpperCase().replace(/\s/g, ''))}
              placeholder="e.g. AGENDA"
              required
              maxLength={10}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase tracking-widest"
            />
            <p className="text-xs text-gray-400 mt-1">{form.solutionWord.length} / 10 letters</p>
          </div>

          {/* Clue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Clue *</label>
            <textarea
              value={form.clue}
              onChange={e => update('clue', e.target.value)}
              placeholder={`Give a hint from the reading material...\ne.g. "Media doesn't tell you what to think — just what to think about."`}
              required
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Max Attempts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Attempts: {form.maxAttempts}</label>
            <input
              type="range"
              min={3}
              max={8}
              value={form.maxAttempts}
              onChange={e => update('maxAttempts', parseInt(e.target.value))}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>3 (harder)</span>
              <span>8 (easier)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-teal-700 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Creating Puzzle...' : 'Create Puzzle (+30 pts)'}
          </button>
        </form>
      </div>
    </MobileLayout>
  );
}

export default function CreatePuzzlePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CreatePuzzleInner />
    </Suspense>
  );
}
