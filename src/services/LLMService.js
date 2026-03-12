import dayjs from 'dayjs';
import { openAiClient } from '../integrations/openaiClient.js';
import { env } from '../config/env.js';
import { toolDefinitions } from '../tools/toolDefinitions.js';
import { AGENT_SYSTEM_PROMPT } from '../agent/systemPrompt.js';

const parseDateFromText = (text) => {
  if (text.includes('today')) return dayjs().toISOString();
  if (text.includes('yesterday')) return dayjs().subtract(1, 'day').toISOString();
  return dayjs().toISOString();
};

const parsePeriodFromText = (text) => {
  if (text.includes('last month')) return { period: 'last_month' };
  if (text.includes('last 7 days') || text.includes('past 7 days')) return { period: '7d' };
  if (text.includes('last 30 days') || text.includes('past 30 days')) return { period: '30d' };
  return { period: '30d' };
};

const inferWorkspace = (text, workspaces = []) => {
  const lower = text.toLowerCase();
  const direct = workspaces.find((w) => lower.includes(w.name.toLowerCase()));
  if (direct) return direct.name;

  if (lower.includes('personal')) {
    const personal = workspaces.find((w) => w.type === 'personal');
    if (personal) return personal.name;
  }

  return null;
};

const inferType = (text) => {
  const lower = text.toLowerCase();
  const expenseKeywords = ['spent', 'expense', 'pay', 'paid', 'bought', 'bill', 'purchase'];
  const incomeKeywords = ['salary', 'income', 'earn', 'earned', 'received', 'bonus'];

  if (expenseKeywords.some((k) => lower.includes(k))) return 'expense';
  if (incomeKeywords.some((k) => lower.includes(k))) return 'income';
  return null;
};

const inferCategory = (text, memory) => {
  const onMatch = text.match(/on\s+([a-zA-Z\s]{2,40})/i);
  if (onMatch) return onMatch[1].trim().toLowerCase();

  if (text.toLowerCase().includes('again') && Array.isArray(memory.frequentCategories)) {
    return memory.frequentCategories[0] || 'general';
  }

  return 'general';
};

const inferTitle = (text, type, category) => {
  const lower = text.toLowerCase();

  if (type === 'income' && lower.includes('salary')) return 'Salary';
  if (type === 'income' && lower.includes('bonus')) return 'Bonus';
  if (type === 'expense' && category && category !== 'general') {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  const words = text.split(/\s+/).filter((w) => !/^[\d.,]+$/.test(w));
  return words.slice(0, 3).join(' ') || (type === 'income' ? 'Income' : 'Expense');
};

export class LLMService {
  async decideAction({ input, memory, workspaces }) {
    if (openAiClient) {
      try {
        const completion = await openAiClient.chat.completions.create({
          model: env.openAiModel,
          temperature: 0.1,
          messages: [
            { role: 'system', content: AGENT_SYSTEM_PROMPT },
            {
              role: 'user',
              content: JSON.stringify({
                command: input,
                memory,
                workspaces: workspaces.map((w) => ({
                  id: w._id,
                  name: w.name,
                  type: w.type,
                })),
              }),
            },
          ],
          tools: toolDefinitions,
          tool_choice: 'auto',
        });

        const message = completion.choices?.[0]?.message;
        const toolCall = message?.tool_calls?.[0];

        if (toolCall?.function?.name) {
          let parsedArgs = {};
          try {
            parsedArgs = JSON.parse(toolCall.function.arguments || '{}');
          } catch (_error) {
            parsedArgs = {};
          }

          return {
            mode: 'tool',
            toolName: toolCall.function.name,
            toolArgs: parsedArgs,
            reasoning: 'llm_tool_call',
          };
        }

        if (message?.content) {
          return {
            mode: 'direct',
            directResponse: message.content,
            reasoning: 'llm_direct',
          };
        }
      } catch (_error) {
        // fall through to deterministic parser
      }
    }

    return this.#fallbackDecision(input, memory, workspaces);
  }

  #fallbackDecision(input, memory, workspaces) {
    const text = input.toLowerCase();
    const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? Number(amountMatch[1]) : null;
    const workspace = inferWorkspace(text, workspaces);

    if (/switch\s+(to\s+)?|use\s+/.test(text) && text.includes('workspace')) {
      const knownName = workspace || workspaces.find((w) => text.includes(w.name.toLowerCase()))?.name;
      if (knownName) {
        return {
          mode: 'tool',
          toolName: 'switch_workspace',
          toolArgs: { workspace_name: knownName },
          reasoning: 'fallback_switch_workspace',
        };
      }

      return {
        mode: 'direct',
        directResponse: 'Please tell me which workspace you want to switch to.',
        reasoning: 'fallback_switch_workspace_missing',
      };
    }

    if (text.includes('recent transaction') || text.includes('last transactions')) {
      return {
        mode: 'tool',
        toolName: 'get_recent_transactions',
        toolArgs: {
          workspace,
          limit: 10,
        },
        reasoning: 'fallback_recent_transactions',
      };
    }

    const isExpenseSummary =
      (text.includes('how much') || text.includes('show')) &&
      (text.includes('spent') || text.includes('expense'));
    if (isExpenseSummary) {
      return {
        mode: 'tool',
        toolName: 'get_expense_summary',
        toolArgs: {
          workspace,
          date_range: parsePeriodFromText(text),
        },
        reasoning: 'fallback_expense_summary',
      };
    }

    const isIncomeSummary =
      (text.includes('how much') || text.includes('show')) && text.includes('income');
    if (isIncomeSummary) {
      return {
        mode: 'tool',
        toolName: 'get_income_summary',
        toolArgs: {
          workspace,
          date_range: parsePeriodFromText(text),
        },
        reasoning: 'fallback_income_summary',
      };
    }

    if (amount) {
      const type = inferType(text) || 'expense';
      const category = inferCategory(text, memory);
      const title = inferTitle(input, type, category);

      return {
        mode: 'tool',
        toolName: 'create_transaction',
        toolArgs: {
          amount,
          type,
          title,
          category,
          workspace,
          date: parseDateFromText(text),
        },
        reasoning: 'fallback_create_transaction',
      };
    }

    return {
      mode: 'direct',
      directResponse:
        'I could not map that to a finance action. Try: "I spent 500 on groceries" or "Show last month expenses".',
      reasoning: 'fallback_unresolved',
    };
  }

  buildResponseFromTool(toolName, toolResult) {
    switch (toolName) {
      case 'create_transaction': {
        const t = toolResult.transaction;
        const alerts = toolResult.budget?.alerts || [];
        const base = `Added ${t.type} of ${t.amount} in ${toolResult.workspace.name} (${t.category}).`;
        if (alerts.length > 0) {
          return `${base} ${alerts[0].message}`;
        }
        return base;
      }
      case 'get_expense_summary':
      case 'get_income_summary': {
        return `Total ${toolResult.type} in ${toolResult.workspace.name} is ${toolResult.total} for the selected period.`;
      }
      case 'get_recent_transactions': {
        if (!toolResult.items.length) {
          return `No recent transactions found in ${toolResult.workspace.name}.`;
        }
        const top = toolResult.items
          .slice(0, 3)
          .map((x) => `${x.type} ${x.amount} (${x.category})`)
          .join(', ');
        return `Recent transactions in ${toolResult.workspace.name}: ${top}.`;
      }
      case 'switch_workspace':
        return `Switched active workspace to ${toolResult.workspace.name}.`;
      default:
        return 'Command executed successfully.';
    }
  }
}
