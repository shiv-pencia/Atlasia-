import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { authValidator } from '../validators/authValidator.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', validate(authValidator.register), authController.register);
router.post('/login', validate(authValidator.login), authController.login);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);

export default router;
