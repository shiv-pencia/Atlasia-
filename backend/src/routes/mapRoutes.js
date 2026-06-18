import { Router } from 'express';
import { mapController } from '../controllers/mapController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

// Protect routing lookups
router.use(protect);

router.get('/search', mapController.searchPlaces);
router.get('/reverse', mapController.reverseGeocode);
router.post('/route', mapController.getRoute);
router.post('/multi-route', mapController.getMultiStopRoute);
router.get('/place/:id', mapController.getPlaceDetails);
router.get('/weather', mapController.getWeather);

export default router;
