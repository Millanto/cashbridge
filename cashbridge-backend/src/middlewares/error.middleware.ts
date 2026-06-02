import { Request, Response, NextFunction } from "express";

/**
 * Standard Operational custom error representation
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Custom global error handling middleware standardizing all Express error JSON outputs.
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "An unexpected CashBridge system error occurred. Our engineers have been alerted.";
  
  // Format precise JSON feedback safely
  const responsePayload: {
    status: string;
    message: string;
    error?: any;
    stack?: string;
  } = {
    status: "error",
    message: message
  };

  // Only expose dirty system stacks and raw exception errors in Non-Production setups
  if (process.env.NODE_ENV !== "production") {
    responsePayload.error = error;
    responsePayload.stack = error.stack;
  }

  // Audit and output errors to telemetry or application console logs
  console.error(`💥 [ERROR AUDITOR] Path: ${req.method} ${req.originalUrl} | Error: ${message}`);
  if (error.stack && process.env.NODE_ENV !== "production") {
    console.error(error.stack);
  }

  return res.status(statusCode).json(responsePayload);
};
