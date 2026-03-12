import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
} from '../validators/transactionValidators.js';
import { createTransaction, listTransactions } from '../controllers/transactionController.js';

const router = Router();

router.post('/', validate(createTransactionSchema), asyncHandler(createTransaction));
router.get('/', validate(listTransactionsQuerySchema, (req) => req.query), asyncHandler(listTransactions));

export default router;
