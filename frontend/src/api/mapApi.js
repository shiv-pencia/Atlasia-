import axiosInstance from '../services/axios';

export const mapApi = {
  getWeather: async (params) => {
    const response = await axiosInstance.get('/map/weather', { params });
    return response.data;
  }
};

export default mapApi;
