'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, Clock, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MobileLayout } from '@/components/MobileLayout';
import { AvatarButton } from '@/components/AvatarButton';
import { StatsCard } from '@/components/StatsCard';
import { getGreeting, getInitials } from '@/lib/utils';

interface HomeData {
  user: { _id: string; name: string; points: number; streak: number; rank: number };
  reading: { _id: string; title: string; weekNumber: number } | null;
  puzzlesAvailable: number;
  participationPct: number;
  top3: { _id: string; name: string; points: number; streak: number }[];
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [timeLeft, setTimeLeft] = useState(54);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/home')
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, [user]);

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(id); return 0; }
        return t - 1;
      });
    }, 60000);
    return () => clearInterval(id);
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const greeting = getGreeting();
  const stats = [
    { label: 'Rank', value: data?.user.rank ? `#${data.user.rank}` : (user.rank ? `#${user.rank}` : '—') },
    { label: 'Points', value: data?.user.points ?? user.points },
    { label: 'Streak', value: data?.user.streak ?? user.streak, icon: <Flame className="w-4 h-4 text-orange-400" /> },
  ];

  return (
    <MobileLayout>
      <div className="px-4 pt-10 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">{greeting},</p>
            <h1 className="text-2xl font-bold text-gray-900">{user.name.split(' ')[0]}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Behavioural Sciences</p>
          </div>
          <AvatarButton name={user.name} />
        </div>

        {/* Stats */}
        <StatsCard stats={stats} />

        {/* Today's Challenge */}
        <div className="mt-4 bg-gray-900 rounded-3xl p-4 shadow-md">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Today&apos;s Challenge</span>
          </div>
          <h2 className="text-white font-bold text-lg leading-tight mb-1">
            {data?.reading?.title || 'Loading...'}
          </h2>
          <p className="text-gray-400 text-sm mb-0.5">
            {data?.puzzlesAvailable ?? '—'} puzzles available
          </p>
          <div className="flex items-center gap-1 text-gray-400 text-sm mb-4">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft} mins until class</span>
          </div>
          <Link
            href="/play"
            className="block w-full bg-teal-500 text-white text-center py-3 rounded-2xl font-bold text-sm hover:bg-teal-400 transition-colors"
          >
            Play Now
          </Link>
        </div>

        {/* Class Participation */}
        <div className="mt-4 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-sm text-gray-700 flex-1">
            <span className="font-bold text-gray-900">{data?.participationPct ?? 0}% of your class</span> has already played today.
          </p>
        </div>

        {/* Today's Top */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Today&apos;s Top</h3>
            <Link href="/leaderboard" className="text-xs text-teal-600 font-semibold flex items-center gap-0.5">
              See all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl divide-y divide-gray-50 shadow-sm border border-gray-100 overflow-hidden">
            {!data ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <span className="w-5 h-4 bg-gray-200 rounded" />
                  <div className="w-7 h-7 rounded-full bg-gray-200" />
                  <div className="flex-1 h-4 bg-gray-200 rounded" />
                  <div className="w-10 h-4 bg-gray-200 rounded" />
                </div>
              ))
            ) : data.top3.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                No one has played yet today. Be the first!
              </div>
            ) : (
              data.top3.map((person, idx) => {
                const isCurrentUser = person._id === user._id;
                return (
                  <div
                    key={person._id}
                    className={`flex items-center gap-3 px-4 py-3 ${isCurrentUser ? 'bg-teal-50' : ''}`}
                  >
                    <span className="w-5 text-sm font-bold text-gray-400">{idx + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
                      {getInitials(person.name)}
                    </div>
                    <span className={`flex-1 text-sm font-medium ${isCurrentUser ? 'text-teal-700 font-bold' : 'text-gray-800'}`}>
                      {isCurrentUser ? `You (${person.name.split(' ')[0]})` : person.name}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{person.points}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
