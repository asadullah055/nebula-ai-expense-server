import mongoose from 'mongoose';

const telegramIntegrationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    telegramId: { type: String, unique: true, sparse: true },
    telegramUsername: { type: String, default: '' },
    isLinked: { type: Boolean, default: false },
    linkCode: { type: String, default: null },
    linkCodeExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const TelegramIntegration = mongoose.model('TelegramIntegration', telegramIntegrationSchema);
