import { z } from "zod";

/**
 * Validation schema for register request data parameters
 */
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Provide a valid email address representation." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
      .regex(/[0-9]/, { message: "Password must contain at least one digit code." }),
    firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
    lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
    companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
    role: z.enum(["merchant", "admin"]).optional().default("merchant")
  })
});

/**
 * Validation schema for login payload keys
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Provide a valid email address representation." }),
    password: z.string().min(1, { message: "Password parameter is required." })
  })
});

/**
 * Validation schema for exchanging refresh token certificates
 */
export const tokenRefreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, { message: "Refresh token parameter is strictly required." })
  })
});
