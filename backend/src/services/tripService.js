import { ApiError } from '../utils/ApiError.js';
import { MESSAGES } from '../constants/messages.js';
import { Trip } from '../models/Trip.js';
import { User } from '../models/User.js';

export const tripService = {
  getTripsByUserId: async (userId) => {
    return await Trip.find({
      $or: [{ userId }, { members: userId }]
    }).populate('userId', 'name email').populate('members', 'name email').sort({ createdAt: -1 });
  },

  getTripById: async (tripId, userId) => {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new ApiError(404, MESSAGES.TRIP.NOT_FOUND);
    }
    const isOwner = trip.userId.toString() === userId;
    const isMember = (trip.members || []).some(m => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, MESSAGES.TRIP.FORBIDDEN);
    }
    return await Trip.findById(tripId)
      .populate('userId', 'name email')
      .populate('members', 'name email');
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
  },

  inviteUser: async (tripId, email, ownerId) => {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new ApiError(404, MESSAGES.TRIP.NOT_FOUND);
    }
    if (trip.userId.toString() !== ownerId) {
      throw new ApiError(403, 'Only the trip owner can invite members');
    }
    
    const targetEmail = email.trim().toLowerCase();
    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) {
      throw new ApiError(404, 'User with this email is not registered yet');
    }

    if (trip.userId.toString() === targetUser._id.toString()) {
      throw new ApiError(400, 'You are the owner of this trip');
    }

    const alreadyMember = (trip.members || []).some(m => m.toString() === targetUser._id.toString());
    if (alreadyMember) {
      throw new ApiError(400, 'User is already a member of this trip');
    }

    const alreadyInvited = (trip.invitations || []).some(inv => inv.email === targetEmail && inv.status === 'pending');
    if (alreadyInvited) {
      throw new ApiError(400, 'Invitation is already pending for this user');
    }

    trip.invitations.push({ email: targetEmail, status: 'pending' });
    await trip.save();

    const updatedTrip = await Trip.findById(tripId)
      .populate('userId', 'name email')
      .populate('members', 'name email');

    return { trip: updatedTrip, targetUserId: targetUser._id };
  },

  getInvitations: async (email) => {
    const targetEmail = email.trim().toLowerCase();
    return await Trip.find({
      'invitations': {
        $elemMatch: { email: targetEmail, status: 'pending' }
      }
    }).populate('userId', 'name email');
  },

  respondToInvitation: async (invitationId, status, userId, email) => {
    const targetEmail = email.trim().toLowerCase();
    if (!['accepted', 'declined'].includes(status)) {
      throw new ApiError(400, 'Invalid status response');
    }

    const trip = await Trip.findOne({ 'invitations._id': invitationId });
    if (!trip) {
      throw new ApiError(404, 'Invitation not found');
    }

    const invitation = trip.invitations.id(invitationId);
    if (!invitation) {
      throw new ApiError(404, 'Invitation not found');
    }

    if (invitation.email !== targetEmail) {
      throw new ApiError(403, 'This invitation was sent to a different email address');
    }

    if (invitation.status !== 'pending') {
      throw new ApiError(400, 'This invitation has already been processed');
    }

    invitation.status = status;

    if (status === 'accepted') {
      if (!trip.members.some(m => m.toString() === userId.toString())) {
        trip.members.push(userId);
      }
    }

    await trip.save();
    return await Trip.findById(trip._id)
      .populate('userId', 'name email')
      .populate('members', 'name email');
  }
};

export default tripService;
