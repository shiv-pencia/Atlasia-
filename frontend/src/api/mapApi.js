import axiosInstance from '../services/axios';

export const mapApi = {
  searchPlaces: async (query) => {
    const response = await axiosInstance.get('/map/search', {
      params: { q: query }
    });
    return response.data;
  },

  getPlaceDetails: async (placeId) => {
    const response = await axiosInstance.get(`/map/place/${placeId}`);
    return response.data;
  },

  getRouteDirections: async (origin, destination) => {
    const response = await axiosInstance.post('/map/route', { origin, destination });
    return response.data;
  },

  getWeather: async (params) => {
    const response = await axiosInstance.get('/map/weather', { params });
    return response.data;
  }
};
