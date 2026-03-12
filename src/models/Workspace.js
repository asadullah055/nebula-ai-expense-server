import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['personal', 'company'], required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    currency: { type: String, default: 'USD' },
    monthlyExpenseLimit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

workspaceSchema.index({ ownerId: 1, name: 1 }, { unique: true });

export const Workspace = mongoose.model('Workspace', workspaceSchema);
