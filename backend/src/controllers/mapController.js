import { mapService } from '../services/mapService.js';

export const mapController = {
  searchPlaces: async (req, res, next) => {
    try {
      const query = req.query.q || '';
      const results = await mapService.searchPlaces(query);
      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  },

  getPlaceDetails: async (req, res, next) => {
    try {
      const placeId = req.params.id;
      const details = await mapService.getPlaceDetails(placeId);
      res.status(200).json(details);
    } catch (error) {
      next(error);
    }
  },

  getRouteDirections: async (req, res, next) => {
    try {
      const { origin, destination } = req.body;
      const route = await mapService.getRouteDirections(origin, destination);
      res.status(200).json(route);
    } catch (error) {
      next(error);
    }
  },

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
