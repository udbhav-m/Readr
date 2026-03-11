import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Puzzle from '@/models/Puzzle';
import PuzzleAttempt from '@/models/PuzzleAttempt';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const puzzleId = searchParams.get('puzzleId');

  if (!puzzleId) return NextResponse.json({ error: 'puzzleId required' }, { status: 400 });

  const attempt = await PuzzleAttempt.findOne({ puzzleId, userId: auth.userId });
  return NextResponse.json({ attempt });
}

export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { puzzleId, guess } = await req.json();

  const puzzle = await Puzzle.findById(puzzleId);
  if (!puzzle) return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });

  let attempt = await PuzzleAttempt.findOne({ puzzleId, userId: auth.userId });

  if (!attempt) {
    attempt = await PuzzleAttempt.create({ puzzleId, userId: auth.userId, guesses: [], attemptsUsed: 0, solved: false });
  }

  if (attempt.solved || attempt.attemptsUsed >= puzzle.maxAttempts) {
    return NextResponse.json({ error: 'Puzzle already completed or out of attempts' }, { status: 400 });
  }

  const normalizedGuess = guess.toUpperCase();
  attempt.guesses.push(normalizedGuess);
  attempt.attemptsUsed += 1;

  // Build letter evaluation
  const solution = puzzle.solutionWord.toUpperCase();
  const solutionArr = solution.split('');
  const guessArr = normalizedGuess.split('');
  const result: { letter: string; status: string }[] = guessArr.map(() => ({ letter: '', status: 'absent' }));
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
    const foundIdx = solutionArr.findIndex((s: string, j: number) => !solutionUsed[j] && s === guessArr[i]);
    if (foundIdx !== -1) {
      result[i] = { letter: guessArr[i], status: 'present' };
      solutionUsed[foundIdx] = true;
    } else {
      result[i] = { letter: guessArr[i], status: 'absent' };
    }
  }

  const isCorrect = normalizedGuess === solution;
  if (isCorrect) {
    attempt.solved = true;
    attempt.completedAt = new Date();

    // Award points
    let pts = 50;
    if (attempt.attemptsUsed === 1) pts += 20; // bonus for first attempt
    await User.findByIdAndUpdate(auth.userId, {
      $inc: { points: pts },
      $push: { completedPuzzles: puzzle._id },
    });

    // Update streak
    const user = await User.findById(auth.userId);
    if (user) {
      const today = new Date();
      const last = user.lastActive;
      const sameDay = last && last.toDateString() === today.toDateString();
      const yesterday = last && new Date(today.getTime() - 86400000).toDateString() === last.toDateString();
      if (!sameDay) {
        user.streak = yesterday ? user.streak + 1 : 1;
        user.lastActive = today;
        await user.save();
      }
    }

    // Recalculate all ranks
    const students = await User.find({ role: 'student' }).sort({ points: -1 });
    for (let i = 0; i < students.length; i++) {
      students[i].rank = i + 1;
      await students[i].save();
    }
  }

  await attempt.save();

  return NextResponse.json({ result, solved: isCorrect, attempt });
}
