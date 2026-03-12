import dayjs from 'dayjs';
import { ApiError } from '../utils/ApiError.js';
import { WorkspaceService } from './WorkspaceService.js';
import { TransactionService } from './TransactionService.js';
import { DateRangeResolver } from './DateRangeResolver.js';
import { BudgetService } from './BudgetService.js';

export class ToolExecutionService {
  constructor() {
    this.workspaceService = new WorkspaceService();
    this.transactionService = new TransactionService();
    this.dateRangeResolver = new DateRangeResolver();
    this.budgetService = new BudgetService();
  }

  async execute(userId, toolName, toolArgs = {}, source, rawInput) {
    switch (toolName) {
      case 'create_transaction':
        return this.#createTransaction(userId, toolArgs, source, rawInput);
      case 'get_expense_summary':
        return this.#getSummary(userId, toolArgs, 'expense');
      case 'get_income_summary':
        return this.#getSummary(userId, toolArgs, 'income');
      case 'get_recent_transactions':
        return this.#getRecentTransactions(userId, toolArgs);
      case 'switch_workspace':
        return this.#switchWorkspace(userId, toolArgs);
      default:
        throw new ApiError(400, `Unsupported tool: ${toolName}`);
    }
  }

  async #createTransaction(userId, args, source, rawInput) {
    const workspace = await this.#resolveWorkspace(userId, args);
    const amount = Number(args.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, 'Amount must be a positive number');
    }

    if (!['income', 'expense'].includes(args.type)) {
      throw new ApiError(400, 'Transaction type must be income or expense');
    }

    const date = args.date ? new Date(args.date) : dayjs().toDate();

    const transaction = await this.transactionService.createTransaction(userId, {
      type: args.type,
      amount,
      title: args.title,
      category: args.category || 'general',
      note: args.note || '',
      date: Number.isNaN(date.getTime()) ? new Date() : date,
      workspaceId: workspace._id,
      source,
      rawInput,
    });

    const budget = await this.budgetService.getMonthlyExpenseUsage(userId, workspace);

    return {
      transaction,
      workspace,
      budget,
    };
  }

  async #getSummary(userId, args, type) {
    const workspace = await this.#resolveWorkspace(userId, args);
    const dateRange = this.dateRangeResolver.resolve({
      period: args.date_range?.period || '30d',
      startDate: args.date_range?.startDate,
      endDate: args.date_range?.endDate,
    });

    const total = await this.transactionService.getSummaryByType(
      userId,
      workspace._id,
      dateRange,
      type
    );

    return {
      type,
      workspace,
      total,
      range: dateRange,
    };
  }

  async #getRecentTransactions(userId, args) {
    const workspace = await this.#resolveWorkspace(userId, args);
    const limit = Number(args.limit) > 0 ? Number(args.limit) : 10;
    const items = await this.transactionService.getRecentTransactions(userId, workspace._id, limit);

    return {
      workspace,
      items,
    };
  }

  async #switchWorkspace(userId, args) {
    if (!args.workspace_name) {
      throw new ApiError(400, 'workspace_name is required');
    }

    const workspace = await this.workspaceService.resolveWorkspaceByName(userId, args.workspace_name);
    await this.workspaceService.switchDefaultWorkspace(userId, workspace._id);

    return {
      workspace,
    };
  }

  async #resolveWorkspace(userId, args) {
    if (args.workspaceId) {
      return this.workspaceService.resolveWorkspace(userId, args.workspaceId);
    }

    if (args.workspace) {
      return this.workspaceService.resolveWorkspaceByName(userId, args.workspace);
    }

    return this.workspaceService.getDefaultWorkspace(userId);
  }
}
