import mongoose from 'mongoose';
import { config } from './index';
import { logger } from '../utils/logger';

export async function connectDatabase() {
  const options = {
    autoIndex: true, // Auto build indexes (in production, set to false and deploy indexes manually)
    maxPoolSize: 50,  // Increase pool limit for high concurrent recruiter requests
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB Atlas database connection established successfully.');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB database connection error context: %O', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB database connection terminated.');
  });

  // Gracefully close connection on process termination
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed gracefully on SIGINT.');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing MongoDB connection: %O', err);
      process.exit(1);
    }
  });

  return mongoose.connect(config.mongodbUri, options);
}
export default connectDatabase;
