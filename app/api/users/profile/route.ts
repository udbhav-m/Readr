import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const user = await User.findById(auth.userId).select('-password');
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { name, currentPassword, newPassword } = await req.json();

  const user = await User.findById(auth.userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (name) user.name = name;

  if (currentPassword && newPassword) {
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    user.password = await bcrypt.hash(newPassword, 12);
  }

  await user.save();
  return NextResponse.json({ message: 'Profile updated', user: { _id: user._id, name: user.name, email: user.email } });
}
