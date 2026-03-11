import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
  name: string;
  subject: string;
  professorId: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const ClassSchema = new Schema<IClass>({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  professorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);
