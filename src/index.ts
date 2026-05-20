import express, { Request, Response, NextFunction } from "express";
import todoRoutes from "./routes/todos";

const app = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());

// Simple request logger (great to show in a demo!)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────

// Health check — first thing to demo after deployment
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Todo API is running 🚀",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.use("/todos", todoRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/`);
  console.log(`   Todos:   http://localhost:${PORT}/todos`);
});

export default app;
