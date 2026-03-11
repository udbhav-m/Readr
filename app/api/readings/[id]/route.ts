import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ReadingMaterial from '@/models/ReadingMaterial';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const reading = await ReadingMaterial.findById(id).populate('createdBy', 'name');
  if (!reading) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ reading });
}
