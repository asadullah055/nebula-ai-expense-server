import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { commandSchema } from '../validators/agentValidators.js';
import { processAgentCommand } from '../controllers/agentController.js';

const router = Router();

router.post('/command', validate(commandSchema), asyncHandler(processAgentCommand));

export default router;
