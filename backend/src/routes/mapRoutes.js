import { Router } from 'express';
import { mapController } from '../controllers/mapController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

// Protect routing lookups
router.use(protect);

router.get('/search', mapController.searchPlaces);
router.get('/place/:id', mapController.getPlaceDetails);
router.post('/route', mapController.getRouteDirections);
router.get('/weather', mapController.getWeather);

export default router;
