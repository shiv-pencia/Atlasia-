import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const connectDB = async () => {
  try {
    const dbUri = process.env.DATABASE_URL;
    if (!dbUri) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    // Hide password from terminal logging
    const safeUriLog = dbUri.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔌 Database connection initialized: Connecting to ${safeUriLog.split('@').pop()}...`);

    const conn = await mongoose.connect(dbUri);

    console.log(`🟢 Database connection established successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`🔴 Database connection failed:`, error.message);
    process.exit(1);
  }
};

export default connectDB;
