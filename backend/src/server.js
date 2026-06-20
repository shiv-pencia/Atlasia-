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
  const tripLocations = new Map(); // tripId -> Map(userId -> { userId, name, latitude, longitude, socketId })

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('register', async (data) => {
      const userId = typeof data === 'object' ? data.userId : data;
      const userName = typeof data === 'object' ? data.name : '';
      
      if (!userId) return;
      socket.userId = userId;
      socket.userName = userName;
      
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      console.log(`👤 User registered: ${userId} (${userName}) with socket: ${socket.id}`);

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

    socket.on('update_location', ({ tripId, latitude, longitude }) => {
      if (!socket.userId || !tripId) return;

      if (!tripLocations.has(tripId)) {
        tripLocations.set(tripId, new Map());
      }

      tripLocations.get(tripId).set(socket.userId, {
        userId: socket.userId,
        name: socket.userName || 'Collaborator',
        latitude,
        longitude,
        socketId: socket.id
      });

      // Broadcast location to the trip room
      io.to(`trip_${tripId}`).emit('location_updated', {
        userId: socket.userId,
        name: socket.userName || 'Collaborator',
        latitude,
        longitude
      });
    });

    socket.on('stop_location', ({ tripId }) => {
      if (!socket.userId || !tripId) return;

      if (tripLocations.has(tripId)) {
        tripLocations.get(tripId).delete(socket.userId);
        if (tripLocations.get(tripId).size === 0) {
          tripLocations.delete(tripId);
        }
      }

      // Broadcast location stopped to the trip room
      io.to(`trip_${tripId}`).emit('location_stopped', {
        userId: socket.userId
      });
    });

    socket.on('request_locations', (tripId) => {
      if (!tripId) return;
      if (tripLocations.has(tripId)) {
        const locations = Array.from(tripLocations.get(tripId).values());
        socket.emit('initial_locations', locations);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      if (socket.userId && userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id);
        if (userSockets.get(socket.userId).size === 0) {
          userSockets.delete(socket.userId);
        }
      }

      // Clean up active locations on disconnect
      if (socket.userId) {
        tripLocations.forEach((locationsMap, tripId) => {
          if (locationsMap.has(socket.userId)) {
            locationsMap.delete(socket.userId);
            io.to(`trip_${tripId}`).emit('location_stopped', {
              userId: socket.userId
            });
            if (locationsMap.size === 0) {
              tripLocations.delete(tripId);
            }
          }
        });
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

