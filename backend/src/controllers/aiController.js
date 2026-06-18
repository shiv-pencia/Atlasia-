import { generateTripPlan, geminiService } from "../services/geminiService.js";
import { tripService } from '../services/tripService.js';

export async function createTripPlan(req, res) {
  try {
    const { prompt } = req.body;

    const result = await generateTripPlan(prompt);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// Keep compatibility with existing endpoints
export const aiController = {
  generateItinerary: async (req, res, next) => {
    try {
      const { tripId } = req.body;
      if (!tripId) {
        return res.status(400).json({ message: 'tripId parameter is required' });
      }

      const trip = await tripService.getTripById(tripId, req.user.id);
      const itinerary = await geminiService.generateItinerary(
        trip.destination,
        trip.startDate,
        trip.endDate,
        trip.budget
      );

      trip.itinerary = itinerary;
      await trip.save();

      console.log(`✨ [AI] Generated itinerary for trip: "${trip.title}"`);
      res.status(200).json(trip);
    } catch (error) {
      next(error);
    }
  },

  chat: async (req, res, next) => {
    try {
      const { tripId, message, history } = req.body;
      if (!message) {
        return res.status(400).json({ message: 'Message field is required' });
      }

      let destination = '';
      if (tripId) {
        const trip = await tripService.getTripById(tripId, req.user.id);
        destination = trip.destination;
      }

      const reply = await geminiService.chat(destination, history || [], message);
      res.status(200).json(reply);
    } catch (error) {
      next(error);
    }
  }
};

export default aiController;
