'use client';

import { useState, useEffect } from 'react';
import { formatTime } from '@/lib/utils';

interface Props {
  initialSeconds?: number;
  onExpire?: () => void;
  className?: string;
}

export function Timer({ initialSeconds = 480, onExpire, className = '' }: Props) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onExpire?.();
      return;
    }
    const id = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds, onExpire]);

  return (
    <span className={`font-mono font-bold tabular-nums ${className} ${seconds < 60 ? 'text-red-500' : ''}`}>
      {formatTime(seconds)}
    </span>
  );
}
