import express from 'express';
import cors from 'cors';
import { ApiError } from './utils/ApiError.js';
import { MESSAGES } from './constants/messages.js';
import errorHandler from './middlewares/errorMiddleware.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/ai', aiRoutes);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(new ApiError(404, MESSAGES.SERVER.ROUTE_NOT_FOUND));
});

// Global Error Handler
app.use(errorHandler);

export default app;
export { app };
