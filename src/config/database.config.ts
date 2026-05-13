import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/person_api?schema=public',
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : 5432,
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  name: process.env.DATABASE_NAME || 'person_api',
  // Connection pool settings
  poolMax: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
  poolMin: parseInt(process.env.DATABASE_POOL_MIN || '0', 10),
  poolAcquire: parseInt(process.env.DATABASE_POOL_ACQUIRE || '60000', 10),
  poolIdle: parseInt(process.env.DATABASE_POOL_IDLE || '10000', 10),
}));