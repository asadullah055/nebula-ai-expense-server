import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { dashboardQuerySchema } from '../validators/dashboardValidators.js';
import { getDashboard } from '../controllers/dashboardController.js';

const router = Router();

router.get('/', validate(dashboardQuerySchema, (req) => req.query), asyncHandler(getDashboard));

export default router;
