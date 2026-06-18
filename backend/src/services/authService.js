import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/ApiError.js';
import { generateToken } from '../utils/generateToken.js';
import { MESSAGES } from '../constants/messages.js';
import { User } from '../models/User.js';

export const authService = {
  register: async (userData) => {
    const { name, email, password } = userData;

    // Check if email already registered in MongoDB
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(400, MESSAGES.AUTH.EMAIL_EXISTS);
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User record in MongoDB
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    console.log(`👤 [Auth] New user registered: ${newUser.name} <${newUser.email}> (ID: ${newUser._id})`);

    // Generate Token
    const token = generateToken(newUser._id);

    return { user: newUser, token };
  },

  login: async (credentials) => {
    const { email, password } = credentials;

    // Query user in MongoDB
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new ApiError(401, MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    // Compare Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const token = generateToken(user._id);
    console.log(`🔑 [Auth] User logged in: ${user.name} <${user.email}> (ID: ${user._id})`);
    
    return { user, token };
  },

  getUserById: async (userId) => {
    return await User.findById(userId);
  }
};

export default authService;
