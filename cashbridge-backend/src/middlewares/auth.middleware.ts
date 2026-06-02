import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./error.middleware";

// Configured values or fallbacks for verification
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "fallback_access_secret_token_signature_key_993";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  companyName?: string;
}

// Extend typical express Request models
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Validates bearer tokens before processing protected routes
 */
export const restrictToAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Access Denied. Bearer token missing from header parameters.", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Access blocked. Authenticated access token has expired.", 401));
    }
    return next(new AppError("Access forbidden. JWT signature is structurally invalid.", 403));
  }
};

/**
 * Access controller restricting actions based on trader or admin roles
 */
export const restrictToRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authorization mismatch. Profile details absent.", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Access Forbidden! Account holds insufficient permissions.", 403));
    }

    next();
  };
};
