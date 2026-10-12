import "dotenv/config";
import "express-async-errors";
import path from "path";
import express, { Request, Response, NextFunction } from "express";
import todoRoutes from "./routes/todos";
import authRoutes from "./auth";
import { pool, connectWithRetry, initSchema } from "./db";

const app = express();
const PORT = process.env.PORT || 8080;
const APP_NAME = process.env.APP_NAME || "Todo API";
const API_VERSION = process.env.API_VERSION || "1.0.0";

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());

// Simple request logger (great to show in a demo!)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────

// Frontend: serves public/index.html at "/"
app.use(express.static(path.join(__dirname, "../public")));

// App info (JSON) — shown in the frontend status bar
app.get("/info", (_req: Request, res: Response) => {
  res.json({
    message: `${APP_NAME} is running 🚀`,
    version: API_VERSION,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Deep health check — used by Docker/load balancers to know the app AND its DB are OK
app.get("/health", async (_req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "unreachable" });
  }
});

app.use("/auth", authRoutes);
app.use("/todos", todoRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler — logs the real error, returns a safe message
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌", err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ── Start server (only after the database is ready) ───────────
async function start() {
  await connectWithRetry();
  await initSchema();
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Health:  http://localhost:${PORT}/health`);
    console.log(`   Todos:   http://localhost:${PORT}/todos`);
  });
}

start().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});

export default app;
