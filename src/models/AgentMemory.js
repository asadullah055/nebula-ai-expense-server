import mongoose from 'mongoose';

const agentMemorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

agentMemorySchema.index({ userId: 1, key: 1, timestamp: -1 });

export const AgentMemory = mongoose.model('AgentMemory', agentMemorySchema);
