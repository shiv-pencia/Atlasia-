import express from "express";
import { createTripPlan, aiController } from "../controllers/aiController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/generate", createTripPlan);

// Protect other generative AI helper endpoints
router.use(protect);

router.post('/chat', aiController.chat);

export default router;
