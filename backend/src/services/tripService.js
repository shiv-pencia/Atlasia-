import { ApiError } from '../utils/ApiError.js';
import { MESSAGES } from '../constants/messages.js';
import { Trip } from '../models/Trip.js';

export const tripService = {
  getTripsByUserId: async (userId) => {
    return await Trip.find({ userId }).sort({ createdAt: -1 });
  },

  getTripById: async (tripId, userId) => {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new ApiError(404, MESSAGES.TRIP.NOT_FOUND);
    }
    if (trip.userId.toString() !== userId) {
      throw new ApiError(403, MESSAGES.TRIP.FORBIDDEN);
    }
    return trip;
  },

  createTrip: async (tripData, userId) => {
    const newTrip = await Trip.create({
      userId,
      ...tripData
    });
    console.log(`✈️ [Trip] Created trip: "${newTrip.title}" to ${newTrip.destination} (ID: ${newTrip.id}) for User: ${userId}`);
    return newTrip;
  },

  updateTrip: async (tripId, tripData, userId) => {
    const trip = await tripService.getTripById(tripId, userId);

    // Update fields
    trip.title = tripData.title ?? trip.title;
    trip.destination = tripData.destination ?? trip.destination;
    trip.source = tripData.source ?? trip.source;
    trip.destinations = tripData.destinations ?? trip.destinations;
    trip.route = tripData.route ?? trip.route;
    trip.notes = tripData.notes ?? trip.notes;
    trip.weatherInfo = tripData.weatherInfo ?? trip.weatherInfo;
    trip.totalDistance = tripData.totalDistance ?? trip.totalDistance;
    trip.estimatedTime = tripData.estimatedTime ?? trip.estimatedTime;
    trip.isFavorite = tripData.isFavorite ?? trip.isFavorite;
    trip.startDate = tripData.startDate ?? trip.startDate;
    trip.endDate = tripData.endDate ?? trip.endDate;
    trip.budget = tripData.budget ?? trip.budget;
    trip.itinerary = tripData.itinerary ?? trip.itinerary;
    trip.expenses = tripData.expenses ?? trip.expenses;

    await trip.save();

    console.log(`✏️ [Trip] Updated trip ID: ${tripId} ("${trip.title}") for User: ${userId}`);
    return trip;
  },

  deleteTrip: async (tripId, userId) => {
    const trip = await tripService.getTripById(tripId, userId);
    const deletedTitle = trip.title;
    
    await Trip.deleteOne({ _id: tripId });
    console.log(`🗑️ [Trip] Deleted trip ID: ${tripId} ("${deletedTitle}") for User: ${userId}`);
    return { success: true };
  },

  // Itinerary functions
  addItineraryItem: async (tripId, itemData, userId) => {
    const trip = await tripService.getTripById(tripId, userId);
    
    // Add subdocument to Mongoose array
    trip.itinerary.push(itemData);
    await trip.save();

    // Get the newly pushed itinerary item (last item)
    const newItem = trip.itinerary[trip.itinerary.length - 1];

    console.log(`📅 [Trip] Added itinerary event: "${newItem.title}" to Trip ID: ${tripId} (User: ${userId})`);
    return newItem;
  },

  // Expense functions
  addExpense: async (tripId, expenseData, userId) => {
    const trip = await tripService.getTripById(tripId, userId);
    
    trip.expenses.push(expenseData);
    await trip.save();

    const newExpense = trip.expenses[trip.expenses.length - 1];

    console.log(`💰 [Trip] Logged expense: "${newExpense.title}" (₹${newExpense.amount}) to Trip ID: ${tripId} (User: ${userId})`);
    return newExpense;
  },

  deleteExpense: async (tripId, expenseId, userId) => {
    const trip = await tripService.getTripById(tripId, userId);
    const initialLength = trip.expenses.length;
    
    // Remove by Mongoose subdocument id
    trip.expenses.pull({ _id: expenseId });
    await trip.save();
    
    if (trip.expenses.length === initialLength) {
      throw new ApiError(404, 'Expense not found');
    }
    
    console.log(`✕ [Trip] Deleted expense ID: ${expenseId} from Trip ID: ${tripId} (User: ${userId})`);
    return { success: true };
  }
};

export default tripService;
