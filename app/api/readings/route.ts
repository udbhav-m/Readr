import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ReadingMaterial from '@/models/ReadingMaterial';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const readings = await ReadingMaterial.find().sort({ weekNumber: 1 }).populate('createdBy', 'name');
  return NextResponse.json({ readings });
}

export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const reading = await ReadingMaterial.create({ ...body, createdBy: auth.userId });
  return NextResponse.json({ reading }, { status: 201 });
}
