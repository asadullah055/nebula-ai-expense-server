import mongoose from 'mongoose';

const commandLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source: { type: String, required: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    rawInput: { type: String, required: true },
    normalizedInput: { type: String, required: true },
    toolName: { type: String, default: null },
    toolArgs: { type: mongoose.Schema.Types.Mixed, default: null },
    toolResult: { type: mongoose.Schema.Types.Mixed, default: null },
    response: { type: String, default: '' },
    status: { type: String, enum: ['success', 'error'], default: 'success' },
    errorMessage: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const CommandLog = mongoose.model('CommandLog', commandLogSchema);
