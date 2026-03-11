'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Gamepad2, Trophy } from 'lucide-react';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/notes', icon: BookOpen, label: 'Notes' },
  { href: '/play', icon: Gamepad2, label: 'Play' },
  { href: '/leaderboard', icon: Trophy, label: 'Rank' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="w-full max-w-sm bg-white border-t border-gray-100 shadow-lg">
        <div className="flex justify-around items-center py-2 px-4">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href === '/notes' && pathname.startsWith('/notes'));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
                  isActive ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} />
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
