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
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  },

  addExpense: async (req, res, next) => {
    try {
      const expense = await tripService.addExpense(req.params.id, req.body, req.user.id);
      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  },

  deleteExpense: async (req, res, next) => {
    try {
      await tripService.deleteExpense(req.params.id, req.params.expenseId, req.user.id);
      res.status(200).json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
};

export default tripController;
