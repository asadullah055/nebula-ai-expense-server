import { normalizeInput } from '../parsers/inputNormalizer.js';
import { CommandLog } from '../models/CommandLog.js';
import { LLMService } from './LLMService.js';
import { ToolExecutionService } from './ToolExecutionService.js';
import { MemoryService } from './MemoryService.js';
import { WorkspaceService } from './WorkspaceService.js';

export class AgentCommandService {
  constructor() {
    this.llmService = new LLMService();
    this.toolExecutionService = new ToolExecutionService();
    this.memoryService = new MemoryService();
    this.workspaceService = new WorkspaceService();
  }

  async processCommand({ userId, input, source, workspaceId, metadata = {} }) {
    const normalizedInput = normalizeInput(input);
    const memory = await this.memoryService.getContext(userId);
    const workspaces = await this.workspaceService.listUserWorkspaces(userId);

    if (workspaceId) {
      const forcedWorkspace = workspaces.find((w) => w._id.toString() === workspaceId.toString());
      if (forcedWorkspace) {
        memory.defaultWorkspace = {
          id: forcedWorkspace._id,
          name: forcedWorkspace.name,
        };
      }
    }

    let decision;
    let toolResult = null;
    let response = '';
    let status = 'success';
    let errorMessage = null;

    try {
      decision = await this.llmService.decideAction({
        input: normalizedInput,
        memory,
        workspaces,
      });

      if (decision.mode === 'direct') {
        response = decision.directResponse;
      } else {
        toolResult = await this.toolExecutionService.execute(
          userId,
          decision.toolName,
          decision.toolArgs,
          source,
          input
        );
        response = this.llmService.buildResponseFromTool(decision.toolName, toolResult);

        await this.memoryService.updateFromCommand(userId, {
          input: normalizedInput,
          toolName: decision.toolName,
          toolArgs: decision.toolArgs,
          toolResult,
          response,
        });
      }
    } catch (error) {
      status = 'error';
      errorMessage = error.message;
      response = `I could not complete that command: ${error.message}`;
    }

    await CommandLog.create({
      userId,
      source,
      workspaceId: toolResult?.workspace?._id || workspaceId || null,
      rawInput: input,
      normalizedInput,
      toolName: decision?.toolName || null,
      toolArgs: decision?.toolArgs || null,
      toolResult,
      response,
      status,
      errorMessage,
      metadata,
    });

    return {
      response,
      status,
      toolName: decision?.toolName || null,
      toolArgs: decision?.toolArgs || null,
      toolResult,
    };
  }
}
