import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  createWorkspaceSchema,
  switchWorkspaceSchema,
  updateWorkspaceSchema,
} from '../validators/workspaceValidators.js';
import {
  createWorkspace,
  listWorkspaces,
  switchWorkspace,
  updateWorkspace,
} from '../controllers/workspaceController.js';

const router = Router();

router.get('/', asyncHandler(listWorkspaces));
router.post('/', validate(createWorkspaceSchema), asyncHandler(createWorkspace));
router.patch('/:workspaceId', validate(updateWorkspaceSchema), asyncHandler(updateWorkspace));
router.post('/switch', validate(switchWorkspaceSchema), asyncHandler(switchWorkspace));

export default router;
