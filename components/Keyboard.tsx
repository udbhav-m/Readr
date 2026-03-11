'use client';

interface Props {
  usedLetters: Record<string, 'correct' | 'present' | 'absent'>;
  onKey: (key: string) => void;
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

const keyStyles: Record<string, string> = {
  correct: 'bg-teal-600 text-white border-teal-600',
  present: 'bg-amber-400 text-white border-amber-400',
  absent: 'bg-gray-400 text-white border-gray-400',
  default: 'bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200',
};

export function Keyboard({ usedLetters, onKey }: Props) {
  return (
    <div className="flex flex-col gap-1.5 items-center">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map(key => {
            const status = usedLetters[key];
            const isWide = key === 'ENTER' || key === '⌫';
            return (
              <button
                key={key}
                onClick={() => onKey(key)}
                className={`${isWide ? 'px-3 text-xs' : 'w-8'} h-12 rounded-lg border font-semibold text-sm transition-colors select-none ${
                  status ? keyStyles[status] : keyStyles.default
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
