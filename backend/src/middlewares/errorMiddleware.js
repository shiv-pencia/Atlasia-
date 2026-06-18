import { MESSAGES } from '../constants/messages.js';

export const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message = MESSAGES.SERVER.INTERNAL_ERROR } = err;

  // In production, mask non-operational internal server error details
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    statusCode = 500;
    message = MESSAGES.SERVER.INTERNAL_ERROR;
  }

  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
