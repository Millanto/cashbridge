import { Router } from "express";
import { BusinessController } from "../controllers/business.controller";
import { restrictToAuth } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  createTransactionSchema,
  createCustomerSchema,
  createDebtSchema,
  recordRepaymentSchema
} from "../validators/business.validator";

const router = Router();

// Secure all business management routes with strict bearer authentication tokens
router.use(restrictToAuth);

/**
 * 1. Bookkeeping Ledger Endpoints
 */
router.post(
  "/transactions",
  validateRequest(createTransactionSchema),
  BusinessController.createTransaction
);

router.get(
  "/transactions",
  BusinessController.getTransactionHistory
);

/**
 * 2. Customer Cohort Registry Endpoints
 */
router.post(
  "/customers",
  validateRequest(createCustomerSchema),
  BusinessController.createCustomer
);

router.get(
  "/customers",
  BusinessController.listCustomers
);

/**
 * 3. Outstanding Trader Debt Endpoints
 */
router.post(
  "/debts",
  validateRequest(createDebtSchema),
  BusinessController.createDebt
);

router.post(
  "/debts/:debtId/repayments",
  validateRequest(recordRepaymentSchema),
  BusinessController.recordRepayment
);

/**
 * 4. Analytics Summaries
 */
router.get(
  "/analytics",
  BusinessController.getAnalyticsSummary
);

export default router;
