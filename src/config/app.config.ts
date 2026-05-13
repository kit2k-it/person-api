import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  apiVersion: process.env.API_VERSION || 'v1',
  appName: process.env.APP_NAME || 'Personal Management System API',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  corsCredentials: process.env.CORS_CREDENTIALS === 'true',
}));