import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-minimum-256-bits',
  expiry: process.env.JWT_EXPIRY || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production-minimum-256-bits',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  cookieName: process.env.JWT_COOKIE_NAME || 'access_token',
  refreshCookieName: process.env.JWT_REFRESH_COOKIE_NAME || 'refresh_token',
}));