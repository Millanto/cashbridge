import { z } from "zod";

/**
 * Validation schema for recording a bookkeeping transaction
 */
export const createTransactionSchema = z.object({
  body: z.object({
    localId: z.string().optional(), // For offline-first correlation matching
    customerId: z.string().uuid().optional(),
    description: z.string().min(3, { message: "Description must be at least 3 characters." }),
    amount: z.number({ required_error: "Amount is required" }), // Positive = Income, Negative = Expense
    category: z.string().optional().default("Sales"), // E.g., 'Sales', 'Inventory', 'Logistics'
    paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "CARD", "DEBT"]).default("CASH"),
    offlineCreatedAt: z.string().datetime().optional() // Passed by app offline sync layer
  })
});

/**
 * Validation schema for creating a new trader customer cohort
 */
export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
    phoneNumber: z.string().optional()
  })
});

/**
 * Validation schema for recording a direct debt ledger record
 */
export const createDebtSchema = z.object({
  body: z.object({
    customerId: z.string().uuid({ message: "A valid customer UUID is required." }),
    amountTotal: z.number().positive({ message: "Debt total amount must be positive." }),
    dueDate: z.string().datetime().optional()
  })
});

/**
 * Validation schema for tracking repayments made on active customer debts
 */
export const recordRepaymentSchema = z.object({
  body: z.object({
    amountPaid: z.number().positive({ message: "Repayment amount must be positive." }),
    paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "CARD"]).default("CASH")
  })
});
