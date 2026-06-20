import { tripService } from '../services/tripService.js';
import { MESSAGES } from '../constants/messages.js';

export const tripController = {
  getAllTrips: async (req, res, next) => {
    try {
      const trips = await tripService.getTripsByUserId(req.user.id);
      res.status(200).json(trips);
    } catch (error) {
      next(error);
    }
  },

  getTripById: async (req, res, next) => {
    try {
      const trip = await tripService.getTripById(req.params.id, req.user.id);
      res.status(200).json(trip);
    } catch (error) {
      next(error);
    }
  },

  createTrip: async (req, res, next) => {
    try {
      const trip = await tripService.createTrip(req.body, req.user.id);
      res.status(201).json(trip);
    } catch (error) {
      next(error);
    }
  },

  updateTrip: async (req, res, next) => {
    try {
      const updated = await tripService.updateTrip(req.params.id, req.body, req.user.id);
      const io = req.app.get('io');
      if (io) {
        const tripIdStr = updated._id ? updated._id.toString() : updated.id;
        io.to(`trip_${tripIdStr}`).emit('trip_updated', updated);
      }
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  },

  deleteTrip: async (req, res, next) => {
    try {
      await tripService.deleteTrip(req.params.id, req.user.id);
      res.status(200).json({ success: true, message: MESSAGES.TRIP.DELETE_SUCCESS });
    } catch (error) {
      next(error);
    }
  },

  addItineraryItem: async (req, res, next) => {
    try {
      const item = await tripService.addItineraryItem(req.params.id, req.body, req.user.id);
      const io = req.app.get('io');
      if (io) {
        const trip = await tripService.getTripById(req.params.id, req.user.id);
        const tripIdStr = trip._id ? trip._id.toString() : trip.id;
        io.to(`trip_${tripIdStr}`).emit('trip_updated', trip);
      }
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  },

  addExpense: async (req, res, next) => {
    try {
      const expense = await tripService.addExpense(req.params.id, req.body, req.user.id);
      const io = req.app.get('io');
      if (io) {
        const trip = await tripService.getTripById(req.params.id, req.user.id);
        const tripIdStr = trip._id ? trip._id.toString() : trip.id;
        io.to(`trip_${tripIdStr}`).emit('trip_updated', trip);
      }
      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  },

  deleteExpense: async (req, res, next) => {
    try {
      await tripService.deleteExpense(req.params.id, req.params.expenseId, req.user.id);
      const io = req.app.get('io');
      if (io) {
        const trip = await tripService.getTripById(req.params.id, req.user.id);
        const tripIdStr = trip._id ? trip._id.toString() : trip.id;
        io.to(`trip_${tripIdStr}`).emit('trip_updated', trip);
      }
      res.status(200).json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  inviteUser: async (req, res, next) => {
    try {
      const { trip, targetUserId } = await tripService.inviteUser(req.params.id, req.body.email, req.user.id);
      const io = req.app.get('io');
      if (io && targetUserId) {
        io.to(`user_${targetUserId}`).emit('invitation_received', {
          message: `${req.user.name} has invited you to join the trip "${trip.title}"`,
          trip
        });
      }
      res.status(200).json(trip);
    } catch (error) {
      next(error);
    }
  },

  getInvitations: async (req, res, next) => {
    try {
      const invitations = await tripService.getInvitations(req.user.email);
      res.status(200).json(invitations);
    } catch (error) {
      next(error);
    }
  },

  respondToInvitation: async (req, res, next) => {
    try {
      const trip = await tripService.respondToInvitation(
        req.params.invitationId,
        req.body.status,
        req.user.id,
        req.user.email
      );
      const io = req.app.get('io');
      if (io) {
        const ownerId = trip.userId._id ? trip.userId._id.toString() : trip.userId.toString();
        io.to(`user_${ownerId}`).emit('notification_received', {
          message: `${req.user.name} has ${req.body.status} your invitation to join the trip "${trip.title}"`,
          trip
        });

        // Broadcast to the trip room so all members see updated details (like new member list)
        const tripIdStr = trip._id ? trip._id.toString() : trip.id;
        io.to(`trip_${tripIdStr}`).emit('trip_updated', trip);
      }
      res.status(200).json(trip);
    } catch (error) {
      next(error);
    }
  }
};

export default tripController;
