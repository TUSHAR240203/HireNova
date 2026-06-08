import { createClient } from 'redis';
import { config } from '../config';
import { logger } from './logger';

export const redisClient = createClient({
  url: config.redisUri
});

redisClient.on('error', (err) => logger.error('Redis client error context: %O', err));
redisClient.on('connect', () => logger.info('Redis database connection initialized.'));

// Establish async connection
redisClient.connect().catch((err) => {
  logger.error('Failed to initialize Redis connection: %O', err);
});
