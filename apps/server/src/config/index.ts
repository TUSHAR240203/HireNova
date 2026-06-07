import dotenv from 'dotenv';
import path from 'path';

// Load environmental parameters
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

export const config = {
  port: process.env.PORT || 3000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hirenova',
  redisUri: process.env.REDIS_URI || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'local_secret_token_default_value',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'local_refresh_token_default_value',
  sessionSecret: process.env.SESSION_SECRET || 'local_session_default_value',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  opensearchUrl: process.env.OPENSEARCH_URL || 'http://localhost:9200',
  kafkaBrokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3BucketName: process.env.S3_BUCKET_NAME || 'hirenova-resumes-local',
    cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN || ''
  }
};
