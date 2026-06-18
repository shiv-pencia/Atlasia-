import { create } from 'zustand';
import { mapApi } from '../../api/mapApi';

export const useMapStore = create((set) => ({
  searchResults: [],
  selectedPlace: null,
  directions: null,
  isLoading: false,
  error: null,
  mapCenter: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco

  searchPlaces: async (query) => {
    if (!query) {
      set({ searchResults: [] });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const results = await mapApi.searchPlaces(query);
      set({ searchResults: results, isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to search places', isLoading: false });
    }
  },

  selectPlace: async (place) => {
    set({ isLoading: true, error: null });
    try {
      const details = await mapApi.getPlaceDetails(place.id);
      set({
        selectedPlace: details,
        mapCenter: details.coordinates,
        isLoading: false
      });
    } catch (err) {
      // If endpoint fails, fall back to basic place data
      set({
        selectedPlace: place,
        mapCenter: place.coordinates || { lat: 37.7749, lng: -122.4194 },
        isLoading: false
      });
    }
  },

  getRoute: async (origin, destination) => {
    set({ isLoading: true, error: null });
    try {
      const routeData = await mapApi.getRouteDirections(origin, destination);
      set({ directions: routeData, isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch directions', isLoading: false });
    }
  },

  clearMapState: () => set({
    searchResults: [],
    selectedPlace: null,
    directions: null,
    error: null
  })
}));
