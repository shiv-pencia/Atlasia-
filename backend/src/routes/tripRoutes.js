import { Router } from 'express';
import { tripController } from '../controllers/tripController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { tripValidator } from '../validators/tripValidator.js';

const router = Router();

// Secure all trip routes
router.use(protect);

router.get('/', tripController.getAllTrips);
router.get('/invitations', tripController.getInvitations);
router.post('/invitations/:invitationId/respond', tripController.respondToInvitation);
router.get('/:id', tripController.getTripById);
router.post('/:id/invite', tripController.inviteUser);
router.post('/', validate(tripValidator.create), tripController.createTrip);
router.put('/:id', validate(tripValidator.update), tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

// Sub-resource routes
router.post('/:id/itinerary', tripController.addItineraryItem);
router.post('/:id/expenses', tripController.addExpense);
router.delete('/:id/expenses/:expenseId', tripController.deleteExpense);

export default router;
