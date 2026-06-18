export const authValidator = {
  register: (data) => {
    const { name, email, password } = data;
    const errors = [];

    if (!name || name.trim().length === 0) {
      errors.push({ message: 'Name is required' });
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      errors.push({ message: 'Please provide a valid email address' });
    }

    if (!password || password.length < 6) {
      errors.push({ message: 'Password must be at least 6 characters long' });
    }

    if (errors.length > 0) {
      return { error: { details: errors }, value: data };
    }

    return { error: null, value: data };
  },

  login: (data) => {
    const { email, password } = data;
    const errors = [];

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      errors.push({ message: 'Please provide a valid email address' });
    }

    if (!password) {
      errors.push({ message: 'Password is required' });
    }

    if (errors.length > 0) {
      return { error: { details: errors }, value: data };
    }

    return { error: null, value: data };
  }
};
export default authValidator;
