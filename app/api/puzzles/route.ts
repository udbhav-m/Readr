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
  const readingId = searchParams.get('readingId');
  const assignedToMe = searchParams.get('assignedToMe');

  const query: Record<string, unknown> = {};
  if (readingId) query.readingMaterialId = readingId;
  if (assignedToMe === 'true') query.assignedTo = auth.userId;

  // By default exclude puzzles created by current user (they shouldn't play their own)
  if (!readingId && !assignedToMe) {
    query.createdBy = { $ne: auth.userId };
  }

  const puzzles = await Puzzle.find(query).populate('createdBy', 'name').sort({ createdAt: -1 });

  // Also get attempt status for each puzzle
  const puzzleIds = puzzles.map(p => p._id);
  const attempts = await PuzzleAttempt.find({ userId: auth.userId, puzzleId: { $in: puzzleIds } });
  const attemptMap = new Map(attempts.map(a => [a.puzzleId.toString(), a]));

  const enriched = puzzles.map(p => {
    const attempt = attemptMap.get(p._id.toString());
    return {
      ...p.toObject(),
      attemptStatus: attempt ? (attempt.solved ? 'solved' : 'in_progress') : 'not_started',
      attemptsUsed: attempt?.attemptsUsed || 0,
    };
  });

  return NextResponse.json({ puzzles: enriched });
}

export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { title, readingMaterialId, puzzleType, solutionWord, clue, maxAttempts } = await req.json();

  if (!title || !readingMaterialId || !solutionWord || !clue) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Find a random student in same class to assign to (not the creator)
  const creator = await User.findById(auth.userId);
  let assignedTo = auth.userId; // fallback

  if (creator?.classId) {
    const classmates = await User.find({
      classId: creator.classId,
      _id: { $ne: auth.userId },
      role: 'student',
    });
    if (classmates.length > 0) {
      const random = classmates[Math.floor(Math.random() * classmates.length)];
      assignedTo = random._id.toString();
    }
  } else {
    // Assign to any other student
    const others = await User.find({ _id: { $ne: auth.userId }, role: 'student' });
    if (others.length > 0) {
      const random = others[Math.floor(Math.random() * others.length)];
      assignedTo = random._id.toString();
    }
  }

  const puzzle = await Puzzle.create({
    title,
    readingMaterialId,
    createdBy: auth.userId,
    assignedTo,
    puzzleType: puzzleType || 'wordle',
    solutionWord: solutionWord.toUpperCase(),
    clue,
    maxAttempts: maxAttempts || 6,
    dateActive: new Date(),
  });

  // Award points for puzzle creation
  await User.findByIdAndUpdate(auth.userId, { $inc: { points: 30 }, $push: { createdPuzzles: puzzle._id } });

  // Recalculate all ranks
  const students = await User.find({ role: 'student' }).sort({ points: -1 });
  for (let i = 0; i < students.length; i++) {
    students[i].rank = i + 1;
    await students[i].save();
  }

  return NextResponse.json({ puzzle }, { status: 201 });
}
