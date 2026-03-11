'use client';

interface LetterResult {
  letter: string;
  status: 'correct' | 'present' | 'absent' | 'empty' | 'active';
}

interface Props {
  guesses: LetterResult[][];
  wordLength: number;
  maxAttempts: number;
  currentRow: number;
  currentGuess: string;
}

const statusStyles: Record<string, string> = {
  correct: 'bg-teal-600 text-white border-teal-600',
  present: 'bg-amber-400 text-white border-amber-400',
  absent: 'bg-gray-500 text-white border-gray-500',
  empty: 'bg-white text-gray-900 border-gray-200',
  active: 'bg-white text-gray-900 border-gray-400',
};

export function WordleGrid({ guesses, wordLength, maxAttempts, currentRow, currentGuess }: Props) {
  return (
    <div className="flex flex-col gap-1.5 items-center my-3">
      {Array.from({ length: maxAttempts }).map((_, rowIdx) => {
        const isCurrentRow = rowIdx === currentRow;
        const guess = isCurrentRow ? currentGuess : '';
        return (
          <div key={rowIdx} className="flex gap-1.5">
            {Array.from({ length: wordLength }).map((_, colIdx) => {
              const submitted = guesses[rowIdx]?.[colIdx];
              const letter = submitted?.letter || (isCurrentRow ? guess[colIdx] || '' : '');
              const status = submitted?.status || (isCurrentRow && guess[colIdx] ? 'active' : 'empty');
              return (
                <div
                  key={colIdx}
                  className={`w-11 h-11 border-2 rounded-lg flex items-center justify-center text-base font-bold uppercase transition-all ${statusStyles[status]}`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
