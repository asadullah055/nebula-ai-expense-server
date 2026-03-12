import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0 },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'general', trim: true },
    note: { type: String, default: '' },
    date: { type: Date, required: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source: { type: String, enum: ['web', 'telegram_text', 'telegram_voice', 'agent'], required: true },
    rawInput: { type: String, default: '' },
  },
  { timestamps: true }
);

transactionSchema.index({ workspaceId: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
