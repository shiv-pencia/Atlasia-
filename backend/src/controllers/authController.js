import { authService } from '../services/authService.js';
import { MESSAGES } from '../constants/messages.js';

export const authController = {
  register: async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: MESSAGES.AUTH.REGISTER_SUCCESS,
        ...result
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        success: true,
        message: MESSAGES.AUTH.LOGIN_SUCCESS,
        ...result
      });
    } catch (error) {
      next(error);
    }
  },

  getMe: async (req, res, next) => {
    try {
      // req.user is populated by protect middleware
      res.status(200).json({
        success: true,
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res, next) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Successfully logged out'
      });
    } catch (error) {
      next(error);
    }
  }
};

export default authController;
