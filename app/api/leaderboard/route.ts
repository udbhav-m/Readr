import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import PuzzleAttempt from '@/models/PuzzleAttempt';
import Puzzle from '@/models/Puzzle';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'allTime';

  let users;

  if (type === 'thisWeek') {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // Get all students
    const allStudents = await User.find({ role: 'student' }).select('name email points streak');

    // Get puzzle attempts this week
    const attempts = await PuzzleAttempt.find({ solved: true, completedAt: { $gte: weekStart } });

    // Get puzzles created this week
    const createdPuzzles = await Puzzle.find({ createdAt: { $gte: weekStart } });

    // Build weekly points map
    const weeklyPoints = new Map<string, number>();
    for (const a of attempts) {
      const uid = a.userId.toString();
      let pts = 50;
      if (a.attemptsUsed === 1) pts += 20; // first-attempt bonus
      weeklyPoints.set(uid, (weeklyPoints.get(uid) || 0) + pts);
    }

    // Add puzzle creation points (30 per puzzle created)
    for (const p of createdPuzzles) {
      const uid = p.createdBy.toString();
      weeklyPoints.set(uid, (weeklyPoints.get(uid) || 0) + 30);
    }

    // Include all students, even those with 0 weekly points
    users = allStudents.map(s => ({
      _id: s._id.toString(),
      name: s.name,
      points: weeklyPoints.get(s._id.toString()) || 0,
      streak: s.streak,
      rank: 0,
    }));

    // Sort by weekly points, then total points as tiebreaker
    users.sort((a, b) => b.points - a.points);
    users = users.map((u, i) => ({ ...u, rank: i + 1 }));
  } else {
    // Recalculate ranks
    const allStudents = await User.find({ role: 'student' }).sort({ points: -1 });
    users = allStudents.map((u, i) => ({
      _id: u._id.toString(),
      name: u.name,
      points: u.points,
      streak: u.streak,
      rank: i + 1,
    }));
  }

  return NextResponse.json({ users });
}
