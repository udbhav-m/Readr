import mongoose, { Schema, Document } from 'mongoose';

export interface IPuzzleAttempt extends Document {
  puzzleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  guesses: string[];
  attemptsUsed: number;
  solved: boolean;
  completedAt?: Date;
}

const PuzzleAttemptSchema = new Schema<IPuzzleAttempt>({
  puzzleId: { type: Schema.Types.ObjectId, ref: 'Puzzle', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  guesses: [{ type: String }],
  attemptsUsed: { type: Number, default: 0 },
  solved: { type: Boolean, default: false },
  completedAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.PuzzleAttempt || mongoose.model<IPuzzleAttempt>('PuzzleAttempt', PuzzleAttemptSchema);
