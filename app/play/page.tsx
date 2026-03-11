'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MobileLayout } from '@/components/MobileLayout';
import { WordleGrid } from '@/components/WordleGrid';
import { Keyboard } from '@/components/Keyboard';
import { Timer } from '@/components/Timer';
import { getInitials } from '@/lib/utils';
import { ArrowLeft, Lightbulb, ChevronRight, Gamepad2 } from 'lucide-react';

interface LetterResult {
  letter: string;
  status: 'correct' | 'present' | 'absent' | 'empty' | 'active';
}

interface PuzzleItem {
  _id: string;
  title: string;
  clue: string;
  solutionWord: string;
  maxAttempts: number;
  createdBy: { name: string } | string;
  readingMaterialId?: string;
}

function evaluateGuess(guess: string, solution: string): LetterResult[] {
  const solutionArr = solution.toUpperCase().split('');
  const guessArr = guess.toUpperCase().split('');
  const result: LetterResult[] = guessArr.map(() => ({ letter: '', status: 'absent' as const }));
  const solutionUsed = new Array(solutionArr.length).fill(false);
  const guessUsed = new Array(guessArr.length).fill(false);

  // First pass: correct positions
  for (let i = 0; i < guessArr.length; i++) {
    if (guessArr[i] === solutionArr[i]) {
      result[i] = { letter: guessArr[i], status: 'correct' };
      solutionUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < guessArr.length; i++) {
    if (guessUsed[i]) continue;
    const foundIdx = solutionArr.findIndex((s, j) => !solutionUsed[j] && s === guessArr[i]);
    if (foundIdx !== -1) {
      result[i] = { letter: guessArr[i], status: 'present' };
      solutionUsed[foundIdx] = true;
    } else {
      result[i] = { letter: guessArr[i], status: 'absent' };
    }
  }

  return result;
}

function updateLetterMap(
  prev: Record<string, 'correct' | 'present' | 'absent'>,
  result: LetterResult[]
): Record<string, 'correct' | 'present' | 'absent'> {
  const updated = { ...prev };
  result.forEach(({ letter, status }) => {
    if (status === 'correct') updated[letter] = 'correct';
    else if (status === 'present' && updated[letter] !== 'correct') updated[letter] = 'present';
    else if (status === 'empty' || status === 'active') { /* skip */ }
    else if (!updated[letter]) updated[letter] = 'absent';
  });
  return updated;
}

export default function PlayPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [allPuzzles, setAllPuzzles] = useState<PuzzleItem[]>([]);
  const [puzzle, setPuzzle] = useState<PuzzleItem | null>(null);
  const [fetching, setFetching] = useState(true);
  const [currentGuess, setCurrentGuess] = useState('');
  const [submittedGuesses, setSubmittedGuesses] = useState<LetterResult[][]>([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [usedLetters, setUsedLetters] = useState<Record<string, 'correct' | 'present' | 'absent'>>({});
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost' | 'timeout'>('playing');
  const [message, setMessage] = useState('');
  const [attemptsUsed, setAttemptsUsed] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    // Fetch all puzzles (not just assigned to me) excluding ones I created
    fetch('/api/puzzles')
      .then(r => r.json())
      .then(d => {
        const puzzles: PuzzleItem[] = (d.puzzles || []).filter(
          (p: PuzzleItem) => {
            const creatorId = typeof p.createdBy === 'object' ? '' : p.createdBy;
            return creatorId !== user._id;
          }
        );
        setAllPuzzles(puzzles);
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [user]);

  function selectPuzzle(p: PuzzleItem) {
    setPuzzle(p);
    setCurrentGuess('');
    setSubmittedGuesses([]);
    setCurrentRow(0);
    setUsedLetters({});
    setGameStatus('playing');
    setMessage('');
    setAttemptsUsed(0);
  }

  const wordLength = puzzle?.solutionWord.length || 6;
  const maxAttempts = puzzle?.maxAttempts || 6;

  const handleKey = useCallback(async (key: string) => {
    if (gameStatus !== 'playing' || !puzzle) return;

    if (key === '⌫' || key === 'Backspace') {
      setCurrentGuess(g => g.slice(0, -1));
      return;
    }

    if (key === 'ENTER' || key === 'Enter') {
      if (currentGuess.length !== wordLength) {
        setMessage(`Word must be ${wordLength} letters`);
        setTimeout(() => setMessage(''), 1500);
        return;
      }

      try {
        let result: LetterResult[];

        if (puzzle._id === 'demo') {
          result = evaluateGuess(currentGuess, puzzle.solutionWord);
        } else {
          const res = await fetch('/api/puzzles/attempt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ puzzleId: puzzle._id, guess: currentGuess }),
          });
          const data = await res.json();

          if (!res.ok) {
            setMessage(data.error || 'Error submitting guess');
            setTimeout(() => setMessage(''), 2000);
            return;
          }

          if (!data.result || !Array.isArray(data.result)) {
            // Fallback: evaluate locally
            result = evaluateGuess(currentGuess, puzzle.solutionWord);
          } else {
            result = data.result;
          }
        }

        const newAttemptsUsed = attemptsUsed + 1;
        setSubmittedGuesses(prev => [...prev, result]);
        setCurrentRow(r => r + 1);
        setAttemptsUsed(newAttemptsUsed);
        setUsedLetters(prev => updateLetterMap(prev, result));

        const isSolved = result.every(r => r.status === 'correct');
        if (isSolved) {
          setGameStatus('won');
          setMessage('Brilliant! 🎉');
          refreshUser(); // Update points/streak in auth context
        } else if (newAttemptsUsed >= maxAttempts) {
          setGameStatus('lost');
          setMessage(`The answer was ${puzzle.solutionWord}`);
        }

        setCurrentGuess('');
      } catch {
        setMessage('Error submitting guess. Try again.');
        setTimeout(() => setMessage(''), 2000);
      }
      return;
    }

    if (/^[A-Za-z]$/.test(key) && currentGuess.length < wordLength) {
      setCurrentGuess(g => g + key.toUpperCase());
    }
  }, [gameStatus, puzzle, currentGuess, wordLength, maxAttempts, attemptsUsed, refreshUser]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKey(e.key);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  const creatorName = puzzle
    ? puzzle.createdBy && typeof puzzle.createdBy === 'object'
      ? puzzle.createdBy.name
      : 'Unknown'
    : '';

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If no puzzle selected, show puzzle list
  if (!puzzle) {
    return (
      <MobileLayout>
        <div className="px-4 pt-10 pb-4">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-teal-600 text-sm font-medium mb-5">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Available Puzzles</h1>
          <p className="text-xs text-gray-400 mb-5">Select a puzzle to play</p>

          {allPuzzles.length === 0 ? (
            <div className="text-center py-12">
              <Gamepad2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-4">No puzzles available right now.</p>
              <p className="text-gray-400 text-xs">Play this demo puzzle instead:</p>
              <button
                onClick={() => selectPuzzle({
                  _id: 'demo',
                  title: 'Guess the concept',
                  clue: '"Media doesn\'t tell you what to think — just what to think about. This theory names that effect."',
                  solutionWord: 'AGENDA',
                  maxAttempts: 6,
                  createdBy: { name: 'Priya M.' },
                })}
                className="mt-3 bg-teal-600 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold"
              >
                Play Demo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {allPuzzles.map(p => {
                const creator = p.createdBy && typeof p.createdBy === 'object' ? p.createdBy.name : 'Unknown';
                return (
                  <button
                    key={p._id}
                    onClick={() => selectPuzzle(p)}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-teal-200 transition-colors text-left flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Gamepad2 className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{p.title}</h3>
                      <p className="text-xs text-gray-400 truncate">
                        By {creator} · {p.solutionWord.length} letters · {p.maxAttempts} attempts
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-4 pt-8 pb-4">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => setPuzzle(null)} className="text-teal-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">WordClue</span>
          </div>
          {gameStatus === 'playing' ? (
            <Timer initialSeconds={480} onExpire={() => setGameStatus('timeout')} className="text-sm text-gray-700" />
          ) : (
            <div className="w-14" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 mt-3 mb-0.5">{puzzle.title || 'Guess the concept'}</h1>
        <p className="text-xs text-gray-400">
          Puzzle by {creatorName} · {attemptsUsed} attempt{attemptsUsed !== 1 ? 's' : ''}
        </p>

        {/* Attempt Circles */}
        <div className="flex items-center gap-2 mt-3 mb-1">
          <div className="flex gap-1.5">
            {Array.from({ length: maxAttempts }).map((_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  i < attemptsUsed
                    ? gameStatus === 'won' && i === attemptsUsed - 1
                      ? 'bg-teal-500 border-teal-500'
                      : 'bg-gray-400 border-gray-400'
                    : 'border-gray-300 bg-white'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">{attemptsUsed} of {maxAttempts} used</span>
        </div>

        {/* Clue Box */}
        <div className="bg-gray-50 rounded-2xl p-3 mb-2 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Clue</span>
          </div>
          <p className="text-sm text-gray-700 italic leading-relaxed">{puzzle.clue}</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`text-center text-sm font-semibold py-2 rounded-2xl mb-2 ${
            gameStatus === 'won' ? 'bg-teal-100 text-teal-700' : 'bg-red-50 text-red-600'
          }`}>
            {message}
          </div>
        )}

        {/* Wordle Grid */}
        <WordleGrid
          guesses={submittedGuesses}
          wordLength={wordLength}
          maxAttempts={maxAttempts}
          currentRow={currentRow}
          currentGuess={currentGuess}
        />

        {/* Keyboard */}
        {gameStatus === 'playing' && (
          <Keyboard usedLetters={usedLetters} onKey={handleKey} />
        )}

        {/* Game Over Banner */}
        {gameStatus !== 'playing' && (
          <div className={`mt-4 rounded-2xl p-4 text-center ${
            gameStatus === 'won' ? 'bg-teal-600' : 'bg-gray-700'
          }`}>
            <p className="text-white font-bold text-lg mb-1">
              {gameStatus === 'won' ? '🎉 Correct!' : gameStatus === 'timeout' ? '⏰ Time\'s up!' : '😔 Better luck next time!'}
            </p>
            <p className="text-white/80 text-sm mb-3">
              {gameStatus === 'won'
                ? `Solved in ${attemptsUsed} attempt${attemptsUsed !== 1 ? 's' : ''}`
                : `The answer was "${puzzle.solutionWord}"`}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setPuzzle(null)}
                className="bg-white text-teal-700 font-semibold text-sm px-5 py-2 rounded-xl hover:bg-teal-50"
              >
                More Puzzles
              </button>
              <button
                onClick={() => router.push('/home')}
                className="bg-white/20 text-white font-semibold text-sm px-5 py-2 rounded-xl hover:bg-white/30"
              >
                Home
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
