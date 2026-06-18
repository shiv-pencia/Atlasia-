export const MESSAGES = {
  AUTH: {
    EMAIL_EXISTS: 'Email address is already registered',
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Access denied. No authentication token provided',
    INVALID_TOKEN: 'Access denied. Authentication token is invalid or expired',
    REGISTER_SUCCESS: 'Account registered successfully',
    LOGIN_SUCCESS: 'Logged in successfully'
  },
  TRIP: {
    NOT_FOUND: 'The requested trip could not be found',
    CREATE_SUCCESS: 'Trip created successfully',
    UPDATE_SUCCESS: 'Trip updated successfully',
    DELETE_SUCCESS: 'Trip deleted successfully',
    FORBIDDEN: 'You do not have permission to modify this trip'
  },
  SERVER: {
    INTERNAL_ERROR: 'Internal server error occurred',
    ROUTE_NOT_FOUND: 'API endpoint route not found'
  }
};
