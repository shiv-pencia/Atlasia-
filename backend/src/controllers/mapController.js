import { mapService } from '../services/mapService.js';

export const mapController = {
  getWeather: async (req, res, next) => {
    try {
      const { lat, lng, q } = req.query;
      const weather = await mapService.getWeather({ lat, lng, q });
      res.status(200).json(weather);
    } catch (error) {
      next(error);
    }
  }
};

export default mapController;
