import { Workspace } from '../models/Workspace.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export class WorkspaceService {
  async listUserWorkspaces(userId) {
    return Workspace.find({ ownerId: userId }).sort({ createdAt: 1 }).lean();
  }

  async createCompanyWorkspace(userId, payload) {
    const workspace = await Workspace.create({
      ...payload,
      ownerId: userId,
      type: 'company',
    });

    return workspace.toObject();
  }

  async updateWorkspace(userId, workspaceId, payload) {
    const workspace = await Workspace.findOneAndUpdate(
      { _id: workspaceId, ownerId: userId },
      payload,
      { new: true }
    ).lean();

    if (!workspace) {
      throw new ApiError(404, 'Workspace not found');
    }

    return workspace;
  }

  async resolveWorkspace(userId, workspaceId) {
    const workspace = await Workspace.findOne({ _id: workspaceId, ownerId: userId }).lean();
    if (!workspace) {
      throw new ApiError(404, 'Workspace not found');
    }

    return workspace;
  }

  async resolveWorkspaceByName(userId, workspaceName) {
    const workspace = await Workspace.findOne({
      ownerId: userId,
      name: { $regex: `^${workspaceName}$`, $options: 'i' },
    }).lean();

    if (!workspace) {
      throw new ApiError(404, `Workspace \"${workspaceName}\" not found`);
    }

    return workspace;
  }

  async switchDefaultWorkspace(userId, workspaceId) {
    const workspace = await Workspace.findOne({ _id: workspaceId, ownerId: userId }).lean();
    if (!workspace) {
      throw new ApiError(404, 'Workspace not found');
    }

    await User.findByIdAndUpdate(userId, { defaultWorkspaceId: workspaceId });
    return workspace;
  }

  async getDefaultWorkspace(userId) {
    const user = await User.findById(userId).populate('defaultWorkspaceId').lean();
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.defaultWorkspaceId) {
      return user.defaultWorkspaceId;
    }

    const personal = await Workspace.findOne({ ownerId: userId, type: 'personal' }).lean();
    if (!personal) {
      throw new ApiError(404, 'No default workspace found');
    }

    await User.findByIdAndUpdate(userId, { defaultWorkspaceId: personal._id });
    return personal;
  }
}
