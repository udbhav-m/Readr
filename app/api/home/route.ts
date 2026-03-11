import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Puzzle from '@/models/Puzzle';
import PuzzleAttempt from '@/models/PuzzleAttempt';
import ReadingMaterial from '@/models/ReadingMaterial';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  // Recalculate ranks for all students
  const allStudents = await User.find({ role: 'student' }).sort({ points: -1 });
  for (let i = 0; i < allStudents.length; i++) {
    if (allStudents[i].rank !== i + 1) {
      allStudents[i].rank = i + 1;
      await allStudents[i].save();
    }
  }

  const user = await User.findById(auth.userId).select('-password');
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Today's reading material (latest)
  const reading = await ReadingMaterial.findOne().sort({ weekNumber: -1 });

  // Puzzles for today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const puzzlesAvailable = reading ? await Puzzle.countDocuments({ readingMaterialId: reading._id }) : 0;

  // Class participation
  const totalStudents = allStudents.length;
  const playedToday = await PuzzleAttempt.distinct('userId', { createdAt: { $gte: todayStart } });
  const participationPct = totalStudents > 0 ? Math.round((playedToday.length / totalStudents) * 100) : 0;

  // Top 3 leaderboard (already sorted by rank)
  const top3 = allStudents.slice(0, 3).map(s => ({
    _id: s._id,
    name: s.name,
    points: s.points,
    streak: s.streak,
  }));

  return NextResponse.json({
    user,
    reading,
    puzzlesAvailable,
    participationPct,
    top3,
  });
}
