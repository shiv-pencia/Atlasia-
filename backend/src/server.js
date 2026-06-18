import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Establish Database Link
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server launched successfully in ${process.env.NODE_ENV || 'development'} mode!`);
    console.log(`📡 Listening for requests on: http://localhost:${PORT}`);
  });

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err) => {
    console.error('🔴 Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });
};

startServer();
