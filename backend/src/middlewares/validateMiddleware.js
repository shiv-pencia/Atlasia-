import { ApiError } from '../utils/ApiError.js';

/**
 * Higher-order middleware to run a validation function.
 * @param {Function} validatorFunc - Synchronous function that returns { error, value }.
 * @returns {Function} Express middleware.
 */
export const validate = (validatorFunc) => {
  return (req, res, next) => {
    const { error, value } = validatorFunc(req.body);
    
    if (error) {
      // Return 400 Bad Request with validation details
      const message = error.details?.map(d => d.message).join(', ') || error.message;
      return next(new ApiError(400, message));
    }
    
    // Replace req.body with sanitized values from validator
    req.body = value;
    next();
  };
};

export default validate;
