import dayjs from 'dayjs';
import { Transaction } from '../models/Transaction.js';
import mongoose from 'mongoose';

export class BudgetService {
  async getMonthlyExpenseUsage(userId, workspace) {
    void userId;
    const start = dayjs().startOf('month').toDate();
    const end = dayjs().endOf('month').toDate();
    const workspaceObjectId = new mongoose.Types.ObjectId(workspace._id);
    const ownerObjectId = new mongoose.Types.ObjectId(workspace.ownerId);

    const result = await Transaction.aggregate([
      {
        $match: {
          workspaceId: workspaceObjectId,
          createdBy: ownerObjectId,
          type: 'expense',
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const spent = result[0]?.total || 0;
    const limit = workspace.monthlyExpenseLimit || 0;
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    const alerts = [];
    if (limit > 0 && percentage >= 100) {
      alerts.push({ level: 'alert', message: `You have used ${percentage}% of your monthly expense limit.` });
    } else if (limit > 0 && percentage >= 80) {
      alerts.push({ level: 'warning', message: `You have used ${percentage}% of your monthly expense limit.` });
    }

    return {
      spent,
      limit,
      percentage,
      alerts,
    };
  }
}
