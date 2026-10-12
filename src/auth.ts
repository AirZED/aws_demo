import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "./db";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "1h") as jwt.SignOptions["expiresIn"];

export interface AuthedRequest extends Request {
  userId?: string;
}

const signToken = (userId: string, email: string) =>
  jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// Middleware: expects "Authorization: Bearer <token>".
// When we move to HttpOnly cookies, only this function (and the login response) changes.
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    req.userId = payload.sub as string;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /auth/register
router.post("/register", async (req: Request, res: Response) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ success: false, message: "A valid email is required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    return;
  }



  const hash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [email, hash]
    );
    // Give every new user a few starter todos for the demo
    await pool.query(
      `INSERT INTO todos (title, completed, user_id) VALUES
        ('Learn Docker', true, $1),
        ('Deploy to AWS EC2', false, $1),
        ('Impress the audience 🚀', false, $1)`,
      [rows[0].id]
    );
    res.status(201).json({
      success: true,
      token: signToken(rows[0].id, rows[0].email),
      user: { id: rows[0].id, email: rows[0].email },
    });
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ success: false, message: "Email already registered" });
      return;
    }
    throw err;
  }
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  const { rows } = await pool.query("SELECT id, email, password_hash FROM users WHERE email = $1", [email]);
  // Same message for unknown email and wrong password (don't reveal which accounts exist)
  const ok = rows.length > 0 && (await bcrypt.compare(password, rows[0].password_hash));
  if (!ok) {
    res.status(401).json({ success: false, message: "Invalid email or password" });
    return;
  }
  res.json({
    success: true,
    token: signToken(rows[0].id, rows[0].email),
    user: { id: rows[0].id, email: rows[0].email },
  });
});

// GET /auth/me — who am I? (used by the frontend to validate a stored token)
router.get("/me", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { rows } = await pool.query("SELECT id, email FROM users WHERE id = $1", [req.userId]);
  if (rows.length === 0) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }
  res.json({ success: true, user: rows[0] });
});

export default router;
