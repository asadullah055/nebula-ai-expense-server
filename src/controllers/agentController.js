import { AgentCommandService } from '../services/AgentCommandService.js';

const agentCommandService = new AgentCommandService();

export const processAgentCommand = async (req, res) => {
  const result = await agentCommandService.processCommand({
    userId: req.user.id,
    input: req.validated.input,
    source: req.validated.source,
    workspaceId: req.validated.workspaceId,
    metadata: req.validated.metadata || {},
  });

  res.json(result);
};
