import { Transaction } from '../models/Transaction.js';
import { WorkspaceService } from './WorkspaceService.js';
import mongoose from 'mongoose';

export class TransactionService {
  constructor() {
    this.workspaceService = new WorkspaceService();
  }

  async createTransaction(userId, payload) {
    await this.workspaceService.resolveWorkspace(userId, payload.workspaceId);

    const transaction = await Transaction.create({
      ...payload,
      createdBy: userId,
    });

    return transaction.toObject();
  }

  async listTransactions(userId, query) {
    let workspaceId = query.workspaceId;

    if (!workspaceId) {
      const defaultWorkspace = await this.workspaceService.getDefaultWorkspace(userId);
      workspaceId = defaultWorkspace._id;
    } else {
      await this.workspaceService.resolveWorkspace(userId, workspaceId);
    }

    const filter = { workspaceId, createdBy: userId };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = new Date(query.startDate);
      if (query.endDate) filter.date.$lte = new Date(query.endDate);
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      Transaction.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(query.limit).lean(),
      Transaction.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async getRecentTransactions(userId, workspaceId, limit = 10) {
    await this.workspaceService.resolveWorkspace(userId, workspaceId);

    return Transaction.find({ workspaceId, createdBy: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getSummaryByType(userId, workspaceId, range, type) {
    await this.workspaceService.resolveWorkspace(userId, workspaceId);

    const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const result = await Transaction.aggregate([
      {
        $match: {
          workspaceId: workspaceObjectId,
          createdBy: userObjectId,
          type,
          date: { $gte: range.start, $lte: range.end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    return result[0]?.total || 0;
  }
}
