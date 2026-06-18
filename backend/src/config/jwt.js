import dotenv from 'dotenv';
dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'atlasia_super_secret_jwt_key_2026',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};
