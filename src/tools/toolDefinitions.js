export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'create_transaction',
      description: 'Create an income or expense transaction in a workspace',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          type: { type: 'string', enum: ['income', 'expense'] },
          title: { type: 'string' },
          category: { type: 'string' },
          note: { type: 'string' },
          workspace: { type: 'string' },
          workspaceId: { type: 'string' },
          date: { type: 'string', description: 'ISO date string' },
        },
        required: ['amount', 'type', 'title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_expense_summary',
      description: 'Get expense summary for a workspace and date range',
      parameters: {
        type: 'object',
        properties: {
          workspace: { type: 'string' },
          workspaceId: { type: 'string' },
          date_range: {
            type: 'object',
            properties: {
              period: { type: 'string', enum: ['7d', '30d', 'last_month', 'custom'] },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
            },
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_income_summary',
      description: 'Get income summary for a workspace and date range',
      parameters: {
        type: 'object',
        properties: {
          workspace: { type: 'string' },
          workspaceId: { type: 'string' },
          date_range: {
            type: 'object',
            properties: {
              period: { type: 'string', enum: ['7d', '30d', 'last_month', 'custom'] },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
            },
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_transactions',
      description: 'Get recent transactions list',
      parameters: {
        type: 'object',
        properties: {
          workspace: { type: 'string' },
          workspaceId: { type: 'string' },
          limit: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'switch_workspace',
      description: 'Switch active/default workspace',
      parameters: {
        type: 'object',
        properties: {
          workspace_name: { type: 'string' },
        },
        required: ['workspace_name'],
      },
    },
  },
];
