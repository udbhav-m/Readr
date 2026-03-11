'use client';

import Link from 'next/link';
import { getInitials } from '@/lib/utils';

interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  asLink?: boolean;
}

export function AvatarButton({ name, size = 'md', className = '', asLink = true }: Props) {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const inner = (
    <div
      className={`${sizeMap[size]} rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shadow-sm ${className}`}
    >
      {getInitials(name)}
    </div>
  );

  if (asLink) {
    return <Link href="/profile">{inner}</Link>;
  }
  return inner;
}
