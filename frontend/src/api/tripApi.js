import axiosInstance from '../services/axios';

export const tripApi = {
  getAllTrips: async () => {
    const response = await axiosInstance.get('/trips');
    return response.data;
  },

  getTripById: async (tripId) => {
    const response = await axiosInstance.get(`/trips/${tripId}`);
    return response.data;
  },

  createTrip: async (tripData) => {
    const response = await axiosInstance.post('/trips', tripData);
    return response.data;
  },

  updateTrip: async (tripId, tripData) => {
    const response = await axiosInstance.put(`/trips/${tripId}`, tripData);
    return response.data;
  },

  deleteTrip: async (tripId) => {
    const response = await axiosInstance.delete(`/trips/${tripId}`);
    return response.data;
  },

  // Itinerary sub-resource endpoints
  addItineraryItem: async (tripId, itemData) => {
    const response = await axiosInstance.post(`/trips/${tripId}/itinerary`, itemData);
    return response.data;
  },

  // Expenses sub-resource endpoints
  addExpense: async (tripId, expenseData) => {
    const response = await axiosInstance.post(`/trips/${tripId}/expenses`, expenseData);
    return response.data;
  },

  deleteExpense: async (tripId, expenseId) => {
    const response = await axiosInstance.delete(`/trips/${tripId}/expenses/${expenseId}`);
    return response.data;
  },

  getInvitations: async () => {
    const response = await axiosInstance.get('/trips/invitations');
    return response.data;
  },

  respondToInvitation: async (invitationId, status) => {
    const response = await axiosInstance.post(`/trips/invitations/${invitationId}/respond`, { status });
    return response.data;
  },

  inviteUser: async (tripId, email) => {
    const response = await axiosInstance.post(`/trips/${tripId}/invite`, { email });
    return response.data;
  }
};
