import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

// Importing Central Handling Middlewares
import { errorHandler } from "./middlewares/error.middleware";
import { loggingMiddleware } from "./middlewares/logging.middleware";
import authRoutes from "./routes/auth.routes";
import businessRoutes from "./routes/business.routes";

// Create express instance
const app: Application = express();

// 1. Security Headers via Helmet
app.use(helmet());

// 2. Cross Origin Resource Sharing (CORS) with strict configurations
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "https://cashbridge-frontend.vercel.app" // Production domain fallback placeholder
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "development") {
        return callback(null, true);
      } else {
        return callback(new Error("CORS policy violation: Source origin rejected."), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  })
);

// 3. Body parsers with payload size restriction safety limits
app.use(express.json({ limit: "10mb" })); // Protection against heavy JSON flooding attacks
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. Request Logging using Morgan paired with custom file-system logs
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}
// Apply custom deep diagnostics logger
app.use(loggingMiddleware);

// 5. API Rate Limiting to prevent brute-force and DoS
const apiRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window duration
  max: 150, // Limit each client IP to 150 transactions / calls per window
  standardHeaders: true, // Return standard rate-limit info in RFC headers
  legacyHeaders: false, // Disable historical X-RateLimit-* headers
  message: {
    status: 429,
    error: "Too many requests. CashBridge API rate limit exceeded. Please wait some minutes."
  }
});

// Apply rate limiter to all API endpoints
app.use("/api/", apiRequestLimiter);

// 6. Base Health Check probe routing endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
    uptime: process.uptime()
  });
});

// 7. Base API Route Placeholder for registration gates
app.get("/api/v1", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to CashBridge African Merchant API Gateway",
    version: "1.0.0",
    docs: "/api/v1/documentation"
  });
});

// 8. Placeholders for actual MVC routers to be added in next development phases
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/business", businessRoutes);
// app.use("/api/v1/sync", syncRoutes);
// app.use("/api/v1/payments", paymentRoutes);

// 9. Centralized Error Handling Middlewares (MUST be declared LAST)
app.use(errorHandler);

export default app;
