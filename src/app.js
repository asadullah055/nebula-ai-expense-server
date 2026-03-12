import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import telegramRoutes, { telegramPublicRouter } from './routes/telegramRoutes.js';

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', async (_req, _res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/telegram', telegramPublicRouter);

app.use('/api/workspaces', authMiddleware, workspaceRoutes);
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/agent', authMiddleware, agentRoutes);
app.use('/api/telegram', authMiddleware, telegramRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
