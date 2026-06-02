import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validation.middleware";
import { registerSchema, loginSchema, tokenRefreshSchema } from "../validators/auth.validator";

const router = Router();

/**
 * Configure routes with strict validation middle gates
 */
router.post(
  "/register", 
  validateRequest(registerSchema), 
  AuthController.register
);

router.post(
  "/login", 
  validateRequest(loginSchema), 
  AuthController.login
);

router.post(
  "/refresh", 
  validateRequest(tokenRefreshSchema), 
  AuthController.refresh
);

router.post(
  "/logout", 
  AuthController.logout
);

export default router;
