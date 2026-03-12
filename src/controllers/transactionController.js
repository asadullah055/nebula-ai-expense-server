import { TransactionService } from '../services/TransactionService.js';

const transactionService = new TransactionService();

export const createTransaction = async (req, res) => {
  const transaction = await transactionService.createTransaction(req.user.id, req.validated);
  res.status(201).json({ transaction });
};

export const listTransactions = async (req, res) => {
  const data = await transactionService.listTransactions(req.user.id, req.validated);
  res.json(data);
};
