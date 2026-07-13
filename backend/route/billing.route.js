import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  initializeFlutterwavePayment,
  verifyFlutterwavePayment,
  flutterwaveWebhook,
  simulateWebhook,
  getSubscriptionHistory,
} from "../controllers/billing.controller.js";

const router = express.Router();

router.post("/initialize-payment", protectRoute, initializeFlutterwavePayment);
router.get("/verify-payment", protectRoute, verifyFlutterwavePayment);
router.get("/subscription-history", protectRoute, getSubscriptionHistory);
router.post("/webhook-test", protectRoute, simulateWebhook);
router.post("/webhook", flutterwaveWebhook);

export default router;
