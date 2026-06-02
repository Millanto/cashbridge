import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { restrictToAuth } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { initializePaymentSchema, verifyPaymentSchema } from "../validators/payment.validator";

const router = Router();

/**
 * ==============================================================================
 * 1. SECURE MERCHANT MANAGEMENT RAILS (Requires JWT session token header)
 * ==============================================================================
 */
router.post(
  "/initialize",
  restrictToAuth,
  validateRequest(initializePaymentSchema),
  PaymentController.initializePayment
);

router.get(
  "/verify/:reference",
  restrictToAuth,
  validateRequest(verifyPaymentSchema),
  PaymentController.verifyPayment
);

router.get(
  "/history",
  restrictToAuth,
  PaymentController.listPaymentHistory
);

/**
 * ==============================================================================
 * 2. PUBLIC INCOMING WEBHOOK RAILS (Unrestricted for incoming carrier pings)
 * ==============================================================================
 */
router.post(
  "/webhooks/paystack",
  PaymentController.handlePaystackWebhook
);

router.post(
  "/webhooks/mtn",
  PaymentController.handleMtnMoMoWebhook
);

export default router;
