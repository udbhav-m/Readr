import mongoose, { Schema, Document } from 'mongoose';

export interface ICoreConcept {
  title: string;
  description: string;
  citation?: string;
}

export interface IKeyTheorist {
  name: string;
  contribution: string;
}

export interface IReadingMaterial extends Document {
  title: string;
  professorName: string;
  subject: string;
  weekNumber: number;
  readingTimeMinutes: number;
  keyTermsCount: number;
  summaryContent: string;
  coreConcepts: ICoreConcept[];
  keyTheorists: IKeyTheorist[];
  pdfUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ReadingMaterialSchema = new Schema<IReadingMaterial>({
  title: { type: String, required: true },
  professorName: { type: String, required: true },
  subject: { type: String, required: true },
  weekNumber: { type: Number, required: true },
  readingTimeMinutes: { type: Number, default: 8 },
  keyTermsCount: { type: Number, default: 3 },
  summaryContent: { type: String, default: '' },
  coreConcepts: [{
    title: String,
    description: String,
    citation: String,
  }],
  keyTheorists: [{
    name: String,
    contribution: String,
  }],
  pdfUrl: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.models.ReadingMaterial || mongoose.model<IReadingMaterial>('ReadingMaterial', ReadingMaterialSchema);
