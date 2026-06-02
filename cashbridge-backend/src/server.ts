import dotenv from "dotenv";
import path from "path";

// 1. Resolve and Load local Environment Variables prior to app boot
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import app from "./app";

// 2. Extract and assign socket parameter
const PORT = Number(process.env.PORT) || 5000;

// 3. Handle Unexpected System Failures gracefully for High Availability
process.on("uncaughtException", (error: Error) => {
  console.error("💥 CRITICAL: [UNCAUGHT EXCEPTION TRIGGERED] - System terminating immediately...");
  console.error(error.name, error.message);
  console.error(error.stack);
  process.exit(1);
});

// Configure server socket binding
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`================================================================`);
  console.log(`🚀 [CASHBRIDGE RUNTIME CLIENT] Boot Sequence Successful!`);
  console.log(`📡 [GATEWAY STATUS] Listening on: http://0.0.0.0:${PORT}`);
  console.log(`⚙️  [ENVIRONMENT MODE] Mode configured as: ${process.env.NODE_ENV || "development"}`);
  console.log(`================================================================`);
});

// 4. Handle Rejected Promises safely to avoid orphan database channels
process.on("unhandledRejection", (reason: any) => {
  console.error("💥 CRITICAL: [UNHANDLED REJECTION TRIGGERED] - Shutting down express sockets safely...");
  console.error(reason);
  server.close(() => {
    process.exit(1);
  });
});
