import dayjs from 'dayjs';
import { Transaction } from '../models/Transaction.js';
import { DateRangeResolver } from './DateRangeResolver.js';
import { WorkspaceService } from './WorkspaceService.js';
import { BudgetService } from './BudgetService.js';
import mongoose from 'mongoose';

export class DashboardService {
  constructor() {
    this.dateRangeResolver = new DateRangeResolver();
    this.workspaceService = new WorkspaceService();
    this.budgetService = new BudgetService();
  }

  async getDashboard(userId, params) {
    const workspace = params.workspaceId
      ? await this.workspaceService.resolveWorkspace(userId, params.workspaceId)
      : await this.workspaceService.getDefaultWorkspace(userId);

    const range = this.dateRangeResolver.resolve(params);

    const [totals, recentTransactions, trendRows, budget] = await Promise.all([
      this.#getTotals(userId, workspace._id, range),
      Transaction.find({ workspaceId: workspace._id, createdBy: userId })
        .sort({ date: -1, createdAt: -1 })
        .limit(8)
        .lean(),
      this.#getDailyTrends(userId, workspace._id, range),
      this.budgetService.getMonthlyExpenseUsage(userId, workspace),
    ]);

    const trendMap = new Map();
    for (let d = dayjs(range.start); !d.isAfter(range.end, 'day'); d = d.add(1, 'day')) {
      trendMap.set(d.format('YYYY-MM-DD'), { date: d.format('YYYY-MM-DD'), income: 0, expense: 0 });
    }

    trendRows.forEach((row) => {
      const dateKey = row.date;
      const item = trendMap.get(dateKey);
      if (!item) return;
      item[row.type] = row.total;
    });

    return {
      workspace,
      period: {
        start: range.start,
        end: range.end,
      },
      totals,
      recentTransactions,
      trends: Array.from(trendMap.values()),
      budget,
    };
  }

  async #getTotals(userId, workspaceId, range) {
    const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const rows = await Transaction.aggregate([
      {
        $match: {
          workspaceId: workspaceObjectId,
          createdBy: userObjectId,
          date: { $gte: range.start, $lte: range.end },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const income = rows.find((r) => r._id === 'income')?.total || 0;
    const expense = rows.find((r) => r._id === 'expense')?.total || 0;

    return {
      income,
      expense,
      balance: income - expense,
    };
  }

  async #getDailyTrends(userId, workspaceId, range) {
    const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return Transaction.aggregate([
      {
        $match: {
          workspaceId: workspaceObjectId,
          createdBy: userObjectId,
          date: { $gte: range.start, $lte: range.end },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id.date',
          type: '$_id.type',
          total: 1,
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);
  }
}
