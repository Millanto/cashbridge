import { z } from "zod";

/**
 * Validation schema for initializing automated payments and payouts
 */
export const initializePaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive({ message: "Payment amount must be a positive number." }),
    paymentGateway: z.enum(["MTN_MOMO", "PAYSTACK"], {
      errorMap: () => ({ message: "Only MTN_MOMO or PAYSTACK are accepted payment gateways." })
    }),
    direction: z.enum(["INBOUND", "OUTBOUND"], {
      errorMap: () => ({ message: "Direction must be INBOUND (Collection) or OUTBOUND (Payout)." })
    }),
    phoneNumber: z.string().optional(), // Strongly suggested for MTN_MOMO request-to-pay/transfer
    email: z.string().email({ message: "A valid customer email is required for Paystack." }).optional(),
    description: z.string().optional()
  })
});

/**
 * Validation schema for manual transaction verification probes
 */
export const verifyPaymentSchema = z.object({
  params: z.object({
    reference: z.string().min(1, { message: "Provider reference parameter is required." })
  })
});
