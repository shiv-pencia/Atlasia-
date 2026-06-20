import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { tripService } from './services/tripService.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Establish Database Link
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  const userSockets = new Map(); // userId -> Set of socketIds

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('register', async (userId) => {
      if (!userId) return;
      socket.userId = userId;
      
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      console.log(`👤 User registered: ${userId} with socket: ${socket.id}`);

      // Join direct notification room
      socket.join(`user_${userId}`);

      // Auto-join trip rooms
      try {
        const trips = await tripService.getTripsByUserId(userId);
        trips.forEach((trip) => {
          const tripIdStr = trip._id ? trip._id.toString() : trip.id;
          socket.join(`trip_${tripIdStr}`);
          console.log(`🔌 Socket ${socket.id} auto-joined room: trip_${tripIdStr}`);
        });
      } catch (error) {
        console.error(`🔴 Error auto-joining trip rooms for user ${userId}:`, error);
      }
    });

    socket.on('join_trip', (tripId) => {
      if (!tripId) return;
      socket.join(`trip_${tripId}`);
      console.log(`🔌 Socket ${socket.id} explicitly joined room: trip_${tripId}`);
    });

    socket.on('leave_trip', (tripId) => {
      if (!tripId) return;
      socket.leave(`trip_${tripId}`);
      console.log(`🔌 Socket ${socket.id} left room: trip_${tripId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      if (socket.userId && userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id);
        if (userSockets.get(socket.userId).size === 0) {
          userSockets.delete(socket.userId);
        }
      }
    });
  });

  // Attach socket.io references to express app
  app.set('io', io);
  app.set('userSockets', userSockets);

  server.listen(PORT, () => {
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

