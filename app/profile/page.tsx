'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Lock, LogOut, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MobileLayout } from '@/components/MobileLayout';
import { AvatarButton } from '@/components/AvatarButton';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'info' | 'password'>('info');
  const [name, setName] = useState(user?.name || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNameUpdate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(''); setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshUser();
      setMsg('Name updated successfully!');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(''); setErr('');
    if (newPw !== confirmPw) { setErr('Passwords do not match'); return; }
    if (newPw.length < 6) { setErr('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg('Password updated!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <MobileLayout>
      <div className="px-4 pt-10 pb-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-teal-600 text-sm font-medium mb-5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Profile Header */}
        <div className="flex flex-col items-center mb-6">
          <AvatarButton name={user.name} size="lg" asLink={false} className="mb-3" />
          <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="flex gap-4 mt-3">
            {[
              { label: 'Points', value: user.points },
              { label: 'Streak', value: `${user.streak} 🔥` },
              { label: 'Rank', value: `#${user.rank || '—'}` },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-bold text-gray-900 text-sm">{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5">
          {(['info', 'password'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setMsg(''); setErr(''); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {t === 'info' ? 'Account Info' : 'Change Password'}
            </button>
          ))}
        </div>

        {msg && (
          <div className="bg-teal-50 text-teal-700 rounded-2xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
            <Check className="w-4 h-4" /> {msg}
          </div>
        )}
        {err && (
          <div className="bg-red-50 text-red-600 rounded-2xl px-4 py-3 text-sm mb-4">{err}</div>
        )}

        {tab === 'info' ? (
          <form onSubmit={handleNameUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input
                value={user.email}
                disabled
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            {[
              { label: 'Current Password', val: currentPw, set: setCurrentPw },
              { label: 'New Password', val: newPw, set: setNewPw },
              { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> {label}
                </label>
                <input
                  type="password"
                  value={val}
                  onChange={e => set(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full mt-6 flex items-center justify-center gap-2 text-red-500 py-3 rounded-2xl border border-red-100 text-sm font-semibold hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </MobileLayout>
  );
}
