import mongoose, { Schema, Document } from 'mongoose';

export interface IPuzzle extends Document {
  title: string;
  readingMaterialId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  puzzleType: 'wordle' | 'quiz';
  solutionWord: string;
  clue: string;
  maxAttempts: number;
  dateActive: Date;
  createdAt: Date;
}

const PuzzleSchema = new Schema<IPuzzle>({
  title: { type: String, required: true },
  readingMaterialId: { type: Schema.Types.ObjectId, ref: 'ReadingMaterial', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  puzzleType: { type: String, enum: ['wordle', 'quiz'], default: 'wordle' },
  solutionWord: { type: String, required: true },
  clue: { type: String, required: true },
  maxAttempts: { type: Number, default: 6 },
  dateActive: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Puzzle || mongoose.model<IPuzzle>('Puzzle', PuzzleSchema);
