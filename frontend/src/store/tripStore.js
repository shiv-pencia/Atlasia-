import { create } from 'zustand';
import { tripApi } from '../api/tripApi';
import { aiApi } from '../api/aiApi';

export const useTripStore = create((set, get) => ({
  trips: [],
  selectedTrip: null,
  isLoading: false,
  error: null,
  invitations: [],

  fetchTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await tripApi.getAllTrips();
      set({ trips: data, isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch trips', isLoading: false });
    }
  },

  fetchTripDetails: async (tripId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await tripApi.getTripById(tripId);
      set({ selectedTrip: data, isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch trip details', isLoading: false });
    }
  },

  createTrip: async (tripData) => {
    set({ isLoading: true, error: null });
    try {
      const newTrip = await tripApi.createTrip(tripData);
      set((state) => ({
        trips: [newTrip, ...state.trips],
        isLoading: false
      }));
      return newTrip;
    } catch (err) {
      set({ error: err.message || 'Failed to create trip', isLoading: false });
      throw err;
    }
  },

  updateTrip: async (tripId, tripData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await tripApi.updateTrip(tripId, tripData);
      set((state) => ({
        trips: state.trips.map((t) => (t.id === tripId ? updated : t)),
        selectedTrip: state.selectedTrip?.id === tripId ? updated : state.selectedTrip,
        isLoading: false
      }));
      return updated;
    } catch (err) {
      set({ error: err.message || 'Failed to update trip', isLoading: false });
      throw err;
    }
  },

  deleteTrip: async (tripId) => {
    set({ isLoading: true, error: null });
    try {
      await tripApi.deleteTrip(tripId);
      set((state) => ({
        trips: state.trips.filter((t) => t.id !== tripId),
        selectedTrip: state.selectedTrip?.id === tripId ? null : state.selectedTrip,
        isLoading: false
      }));
    } catch (err) {
      set({ error: err.message || 'Failed to delete trip', isLoading: false });
      throw err;
    }
  },

  toggleFavorite: async (tripId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return;
    const nextFavorite = !trip.isFavorite;

    // Optimistic Update
    set((state) => ({
      trips: state.trips.map((t) => (t.id === tripId ? { ...t, isFavorite: nextFavorite } : t)),
      selectedTrip: state.selectedTrip?.id === tripId ? { ...state.selectedTrip, isFavorite: nextFavorite } : state.selectedTrip
    }));

    try {
      await tripApi.updateTrip(tripId, { isFavorite: nextFavorite });
    } catch (err) {
      // Rollback on failure
      set((state) => ({
        trips: state.trips.map((t) => (t.id === tripId ? { ...t, isFavorite: !nextFavorite } : t)),
        selectedTrip: state.selectedTrip?.id === tripId ? { ...state.selectedTrip, isFavorite: !nextFavorite } : state.selectedTrip
      }));
    }
  },

  addItineraryItem: async (tripId, itemData) => {
    try {
      const updatedItinerary = await tripApi.addItineraryItem(tripId, itemData);
      set((state) => {
        if (state.selectedTrip && state.selectedTrip.id === tripId) {
          return {
            selectedTrip: {
              ...state.selectedTrip,
              itinerary: [...(state.selectedTrip.itinerary || []), updatedItinerary]
            }
          };
        }
        return {};
      });
    } catch (err) {
      set({ error: err.message || 'Failed to add itinerary item' });
      throw err;
    }
  },

  addExpense: async (tripId, expenseData) => {
    try {
      const updatedExpense = await tripApi.addExpense(tripId, expenseData);
      set((state) => {
        if (state.selectedTrip && state.selectedTrip.id === tripId) {
          return {
            selectedTrip: {
              ...state.selectedTrip,
              expenses: [...(state.selectedTrip.expenses || []), updatedExpense]
            }
          };
        }
        return {};
      });
    } catch (err) {
      set({ error: err.message || 'Failed to add expense' });
      throw err;
    }
  },

  deleteExpense: async (tripId, expenseId) => {
    try {
      await tripApi.deleteExpense(tripId, expenseId);
      set((state) => {
        if (state.selectedTrip && state.selectedTrip.id === tripId) {
          return {
            selectedTrip: {
              ...state.selectedTrip,
              expenses: (state.selectedTrip.expenses || []).filter((e) => e.id !== expenseId)
            }
          };
        }
        return {};
      });
    } catch (err) {
      set({ error: err.message || 'Failed to delete expense' });
      throw err;
    }
  },

  fetchInvitations: async () => {
    try {
      const data = await tripApi.getInvitations();
      set({ invitations: data });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch invitations' });
    }
  },

  respondToInvitation: async (invitationId, status) => {
    try {
      await tripApi.respondToInvitation(invitationId, status);
      await get().fetchTrips();
      await get().fetchInvitations();
    } catch (err) {
      set({ error: err.message || 'Failed to respond to invitation' });
      throw err;
    }
  },

  inviteUser: async (tripId, email) => {
    try {
      const updatedTrip = await tripApi.inviteUser(tripId, email);
      set((state) => ({
        selectedTrip: state.selectedTrip?.id === tripId ? updatedTrip : state.selectedTrip,
        trips: state.trips.map(t => t.id === tripId ? updatedTrip : t)
      }));
      return updatedTrip;
    } catch (err) {
      set({ error: err.message || 'Failed to invite user' });
      throw err;
    }
  }
}));
