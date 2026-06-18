import axiosInstance from '../services/axios';

export const mapApi = {
  searchPlaces: async (query) => {
    const response = await axiosInstance.get('/map/search', {
      params: { q: query }
    });
    return response.data;
  },

  reverseGeocode: async (lat, lon) => {
    const response = await axiosInstance.get('/map/reverse', {
      params: { lat, lon }
    });
    return response.data;
  },

  getRouteDirections: async (start, end) => {
    const response = await axiosInstance.post('/map/route', { start, end });
    return response.data;
  },

  getMultiStopRoute: async (coordinates) => {
    const response = await axiosInstance.post('/map/multi-route', { coordinates });
    return response.data;
  },

  getPlaceDetails: async (placeId) => {
    const response = await axiosInstance.get(`/map/place/${placeId}`);
    return response.data;
  },

  getWeather: async (params) => {
    const response = await axiosInstance.get('/map/weather', { params });
    return response.data;
  }
};

export default mapApi;
