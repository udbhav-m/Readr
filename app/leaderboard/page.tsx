'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MobileLayout } from '@/components/MobileLayout';
import { getInitials } from '@/lib/utils';

interface LeaderUser {
  _id: string;
  name: string;
  points: number;
  streak: number;
  rank: number;
}

const INITIAL_SHOW = 4; // ranks 4-7

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'thisWeek' | 'allTime'>('thisWeek');
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    setExpanded(false);
    fetch(`/api/leaderboard?type=${tab}`)
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [user, tab]);

  const top3 = users.slice(0, 3);
  const allRest = users.slice(3);
  const visibleRest = expanded ? allRest : allRest.slice(0, INITIAL_SHOW);
  const hiddenCount = allRest.length - INITIAL_SHOW;
  const currentUserIdx = users.findIndex(u => u._id === user?._id);
  const currentUserInVisible = currentUserIdx >= 0 && currentUserIdx < 3 + (expanded ? allRest.length : INITIAL_SHOW);

  const MEDAL_ORDER = [1, 0, 2]; // 2nd left, 1st center, 3rd right
  const medalColors = ['bg-gray-300 text-gray-700', 'bg-amber-400 text-white', 'bg-amber-600 text-white'];
  const medalSizes = ['w-14 h-14', 'w-16 h-16', 'w-14 h-14'];

  function renderUserRow(person: LeaderUser, rank: number, highlight?: boolean) {
    const isCurrentUser = person._id === user?._id;
    const shouldHighlight = isCurrentUser || highlight;
    return (
      <div key={person._id} className={`flex items-center gap-3 px-4 py-3 ${shouldHighlight ? 'bg-teal-50' : ''}`}>
        <span className={`w-5 text-sm font-bold ${isCurrentUser ? 'text-teal-600' : 'text-gray-400'}`}>{rank}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCurrentUser ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          {getInitials(person.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-teal-700' : 'text-gray-800'}`}>
            {isCurrentUser ? `You (${person.name.split(' ')[0]})` : person.name}
          </p>
          <div className="flex items-center gap-0.5 text-xs text-gray-400">
            <Flame className="w-3 h-3 text-orange-400" />
            {person.streak} day streak
          </div>
        </div>
        <span className={`text-sm font-bold ${isCurrentUser ? 'text-teal-600' : 'text-gray-900'}`}>{person.points}</span>
      </div>
    );
  }

  return (
    <MobileLayout>
      <div className="px-4 pt-10 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">Behavioural Sciences · Week 6</p>
          </div>
          <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5 mt-3">
          {([['thisWeek', 'This Week'], ['allTime', 'All Time']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === key ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {fetching ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center text-gray-400 py-12 text-sm">No data yet for this period.</div>
        ) : (
          <>
            {/* Top 3 Medals */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-4 mb-6 pt-2">
                {MEDAL_ORDER.map(idx => {
                  const person = top3[idx];
                  if (!person) return <div key={idx} className="w-20" />;
                  const isCurrentUser = person._id === user?._id;
                  const positionLabels = ['1st', '2nd', '3rd'];
                  return (
                    <div key={idx} className={`flex flex-col items-center ${idx === 0 ? 'mb-4' : ''}`}>
                      <div className={`relative ${medalSizes[idx]} rounded-full ${medalColors[idx]} flex items-center justify-center font-bold text-lg shadow-md border-2 ${isCurrentUser ? 'border-teal-500' : 'border-white'}`}>
                        {getInitials(person.name)}
                        <span className="absolute -top-2 -right-1 text-xs bg-white rounded-full px-1 shadow text-gray-600 font-bold">{positionLabels[idx]}</span>
                      </div>
                      <p className={`text-xs font-bold mt-1.5 text-center max-w-[72px] truncate ${isCurrentUser ? 'text-teal-600' : 'text-gray-800'}`}>
                        {isCurrentUser ? 'You' : person.name.split(' ')[0]}
                      </p>
                      <p className="text-xs text-gray-500 font-semibold">{person.points} pts</p>
                      <div className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Flame className="w-3 h-3 text-orange-400" />
                        {person.streak}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rest of rankings */}
            <div className="bg-white rounded-2xl divide-y divide-gray-50 shadow-sm border border-gray-100 overflow-hidden">
              {visibleRest.map((person, i) => renderUserRow(person, i + 4))}

              {/* Current user if not visible in the list */}
              {!currentUserInVisible && currentUserIdx >= 0 && user && (
                <>
                  <div className="px-4 py-1.5 bg-gray-50 text-center text-xs text-gray-400">···</div>
                  {renderUserRow(users[currentUserIdx], currentUserIdx + 1, true)}
                </>
              )}
            </div>

            {/* Expand/collapse */}
            {hiddenCount > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-teal-600 font-semibold py-2 hover:bg-teal-50 rounded-xl transition-colors"
              >
                {expanded ? (
                  <>Show less <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>+{hiddenCount} more classmates <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </MobileLayout>
  );
}
