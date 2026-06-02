import { Router } from "express";
import { SyncController } from "../controllers/sync.controller";
import { restrictToAuth } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { syncPayloadSchema } from "../validators/sync.validator";

const router = Router();

/**
 * Sync queue endpoints
 */
router.post(
  "/transactions",
  restrictToAuth,
  validateRequest(syncPayloadSchema),
  SyncController.executeOfflineSync
);

export default router;
