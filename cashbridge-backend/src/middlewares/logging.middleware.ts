import { Request, Response, NextFunction } from "express";

/**
 * Custom Transaction Logging Middleware
 * Outputs clean formatted execution logs with precision execution times to track performance bottlenecks.
 */
export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  const timestamp = new Date().toISOString();
  
  // Register performance completion calculations
  res.on("finish", () => {
    const diff = process.hrtime(start);
    const durationInMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
    
    const clientIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "UNKNOWN_IP";
    const statusCode = res.statusCode;
    
    // Select visual badges based on response category
    let statusColor = "🟢";
    if (statusCode >= 400 && statusCode < 500) {
      statusColor = "🟡";
    } else if (statusCode >= 500) {
      statusColor = "🔴";
    }

    console.log(
      `[cb-audit] ${statusColor} [${timestamp}] - ${req.method} ${req.originalUrl} | Status: ${statusCode} | Duration: ${durationInMs}ms | Remote IP: ${clientIP}`
    );
  });

  next();
};
