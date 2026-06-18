import { mapService } from '../services/mapService.js';

export const mapController = {
  searchPlaces: async (req, res, next) => {
    try {
      const query = req.query.q || '';
      const rawResults = await mapService.searchPlace(query);
      
      // Map format to maintain compatibility with existing frontend expectations
      const results = (rawResults || []).map((item) => ({
        id: String(item.place_id),
        name: item.display_name,
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        }
      }));
      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  },

  reverseGeocode: async (req, res, next) => {
    try {
      const { lat, lon } = req.query;
      if (lat === undefined || lon === undefined) {
        return res.status(400).json({ message: 'lat and lon query parameters are required' });
      }
      const result = await mapService.reverseGeocode(parseFloat(lat), parseFloat(lon));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  getRoute: async (req, res, next) => {
    try {
      const { start, end } = req.body;
      if (!start || !end) {
        return res.status(400).json({ message: 'start and end parameters are required' });
      }
      const route = await mapService.getRoute(start, end);
      res.status(200).json(route);
    } catch (error) {
      next(error);
    }
  },

  getMultiStopRoute: async (req, res, next) => {
    try {
      const { coordinates } = req.body;
      if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
        return res.status(400).json({ message: 'coordinates array with at least 2 points is required' });
      }
      const route = await mapService.getMultiStopRoute(coordinates);
      res.status(200).json(route);
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
