import { Router, Request, Response } from "express";
import { CreateTodoBody } from "../types";
import { pool } from "../db";
import { requireAuth, AuthedRequest } from "../auth";

const router = Router();
router.use(requireAuth); // every todo route needs a valid token

// Map a DB row (snake_case) to the API shape (camelCase)
const toTodo = (r: any) => ({
  id: r.id,
  title: r.title,
  completed: r.completed,
  createdAt: r.created_at,
});

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// GET /todos — fetch all todos
router.get("/", async (req: AuthedRequest, res: Response) => {
  const { rows } = await pool.query("SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at", [req.userId]);
  res.json({ success: true, count: rows.length, data: rows.map(toTodo) });
});

// GET /todos/:id — fetch a single todo
router.get("/:id", async (req: AuthedRequest, res: Response) => {
  if (!isUuid(req.params.id)) {
    res.status(404).json({ success: false, message: "Todo not found" });
    return;
  }
  const { rows } = await pool.query("SELECT * FROM todos WHERE id = $1 AND user_id = $2", [req.params.id, req.userId]);
  if (rows.length === 0) {
    res.status(404).json({ success: false, message: "Todo not found" });
    return;
  }
  res.json({ success: true, data: toTodo(rows[0]) });
});

// POST /todos — create a new todo
router.post("/", async (req: AuthedRequest & Request<{}, {}, CreateTodoBody>, res: Response) => {
  const { title } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    res.status(400).json({ success: false, message: "Title is required" });
    return;
  }

  // $1 placeholder = parameterized query (prevents SQL injection)
  const { rows } = await pool.query(
    "INSERT INTO todos (title, user_id) VALUES ($1, $2) RETURNING *",
    [title.trim(), req.userId]
  );
  res.status(201).json({ success: true, data: toTodo(rows[0]) });
});

// PATCH /todos/:id — toggle complete/incomplete
router.patch("/:id", async (req: AuthedRequest, res: Response) => {
  if (!isUuid(req.params.id)) {
    res.status(404).json({ success: false, message: "Todo not found" });
    return;
  }
  const { rows } = await pool.query(
    "UPDATE todos SET completed = NOT completed WHERE id = $1 AND user_id = $2 RETURNING *",
    [req.params.id, req.userId]
  );
  if (rows.length === 0) {
    res.status(404).json({ success: false, message: "Todo not found" });
    return;
  }
  res.json({ success: true, data: toTodo(rows[0]) });
});

// DELETE /todos/:id — delete a todo
router.delete("/:id", async (req: AuthedRequest, res: Response) => {
  if (!isUuid(req.params.id)) {
    res.status(404).json({ success: false, message: "Todo not found" });
    return;
  }
  const result = await pool.query("DELETE FROM todos WHERE id = $1 AND user_id = $2", [req.params.id, req.userId]);
  if (result.rowCount === 0) {
    res.status(404).json({ success: false, message: "Todo not found" });
    return;
  }
  res.json({ success: true, message: "Todo deleted" });
});

export default router;
