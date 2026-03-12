import { AgentMemory } from '../models/AgentMemory.js';

export class MemoryService {
  async getContext(userId) {
    const rows = await AgentMemory.find({ userId })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    const byKey = new Map();
    for (const row of rows) {
      if (!byKey.has(row.key)) {
        byKey.set(row.key, row.value);
      }
    }

    return {
      defaultWorkspace: byKey.get('defaultWorkspace') || null,
      frequentCategories: byKey.get('frequentCategories') || [],
      recentFinancialActions: byKey.get('recentFinancialActions') || [],
      conversationHistory: byKey.get('conversationHistory') || [],
      preferences: byKey.get('preferences') || {},
    };
  }

  async setMemory(userId, key, value) {
    await AgentMemory.create({ userId, key, value, timestamp: new Date() });
  }

  async updateFromCommand(userId, { input, toolName, toolArgs, toolResult, response }) {
    const historyEntry = {
      input,
      toolName,
      toolArgs,
      response,
      timestamp: new Date().toISOString(),
    };

    const existing = (await this.getContext(userId)).conversationHistory || [];
    const nextHistory = [historyEntry, ...existing].slice(0, 10);

    await this.setMemory(userId, 'conversationHistory', nextHistory);

    if (toolName === 'create_transaction' && toolResult?.transaction) {
      const action = {
        type: toolResult.transaction.type,
        amount: toolResult.transaction.amount,
        category: toolResult.transaction.category,
        workspaceId: toolResult.transaction.workspaceId,
        date: toolResult.transaction.date,
      };

      const existingActions = (await this.getContext(userId)).recentFinancialActions || [];
      await this.setMemory(userId, 'recentFinancialActions', [action, ...existingActions].slice(0, 10));

      const existingCategories = new Set((await this.getContext(userId)).frequentCategories || []);
      if (toolResult.transaction.category) {
        existingCategories.add(toolResult.transaction.category.toLowerCase());
      }
      await this.setMemory(userId, 'frequentCategories', Array.from(existingCategories).slice(0, 20));
    }

    if (toolName === 'switch_workspace' && toolResult?.workspace) {
      await this.setMemory(userId, 'defaultWorkspace', {
        id: toolResult.workspace._id,
        name: toolResult.workspace.name,
      });
    }
  }
}
