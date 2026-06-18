import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { MESSAGES } from '../constants/messages.js';
import { ApiError } from '../utils/ApiError.js';
import { authService } from '../services/authService.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check Authorization header for Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, MESSAGES.AUTH.UNAUTHORIZED);
    }

    try {
      // Decode JWT token
      const decoded = jwt.verify(token, jwtConfig.secret);
      
      // Load user details
      const user = await authService.getUserById(decoded.id);
      if (!user) {
        throw new ApiError(401, MESSAGES.AUTH.INVALID_TOKEN);
      }

      // Attach user object to request
      req.user = user;
      next();
    } catch (err) {
      throw new ApiError(401, MESSAGES.AUTH.INVALID_TOKEN);
    }
  } catch (error) {
    next(error);
  }
};

export default protect;
