import { WorkspaceService } from '../services/WorkspaceService.js';

const workspaceService = new WorkspaceService();

export const listWorkspaces = async (req, res) => {
  const workspaces = await workspaceService.listUserWorkspaces(req.user.id);
  res.json({ items: workspaces });
};

export const createWorkspace = async (req, res) => {
  const workspace = await workspaceService.createCompanyWorkspace(req.user.id, req.validated);
  res.status(201).json({ workspace });
};

export const updateWorkspace = async (req, res) => {
  const workspace = await workspaceService.updateWorkspace(req.user.id, req.params.workspaceId, req.validated);
  res.json({ workspace });
};

export const switchWorkspace = async (req, res) => {
  const workspace = await workspaceService.switchDefaultWorkspace(req.user.id, req.validated.workspaceId);
  res.json({ workspace });
};
