import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'professor' | 'admin';
  classId?: mongoose.Types.ObjectId;
  points: number;
  streak: number;
  rank: number;
  createdPuzzles: mongoose.Types.ObjectId[];
  completedPuzzles: mongoose.Types.ObjectId[];
  lastActive?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'professor', 'admin'], default: 'student' },
  classId: { type: Schema.Types.ObjectId, ref: 'Class' },
  points: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  createdPuzzles: [{ type: Schema.Types.ObjectId, ref: 'Puzzle' }],
  completedPuzzles: [{ type: Schema.Types.ObjectId, ref: 'Puzzle' }],
  lastActive: { type: Date },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
