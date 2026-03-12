import mongoose from 'mongoose';
import { env } from './env.js';

let connectionPromise = null;

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.mongoUri)
      .then((conn) => {
        // eslint-disable-next-line no-console
        console.log('MongoDB connected');
        return conn;
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
};
