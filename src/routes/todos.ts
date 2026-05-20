import { Router, Request, Response } from "express";
import { Todo, CreateTodoBody } from "../types";
import { randomUUID } from "crypto";

const router = Router();

// In-memory store (perfect for a demo!)
const todos: Todo[] = [
  {
    id: randomUUID(),
    title: "Learn Docker",
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    title: "Deploy to AWS EC2",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    title: "Impress the audience 🚀",
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

// GET /todos — fetch all todos
router.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    count: todos.length,
    data: todos,
  });
});

// GET /todos/:id — fetch a single todo
router.get("/:id", (req: Request, res: Response) => {
  const todo = todos.find((t) => t.id === req.params.id);

  if (!todo) {
    res.status(404).json({ success: false, message: "Todo not found" });
    return;
  }

  res.json({ success: true, data: todo });
});

// POST /todos — create a new todo
router.post("/", (req: Request<{}, {}, CreateTodoBody>, res: Response) => {
  const { title } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    res.status(400).json({ success: false, message: "Title is required" });
    return;
  }

  const newTodo: Todo = {
    id: randomUUID(),
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  };

  todos.push(newTodo);

  res.status(201).json({ success: true, data: newTodo });
});

// PATCH /todos/:id — mark todo as complete/incomplete
router.patch("/:id", (req: Request, res: Response) => {
  const todo = todos.find((t) => t.id === req.params.id);

  if (!todo) {
    res.status(404).json({ success: false, message: "Todo not found" });
    return;
  }

  todo.completed = !todo.completed;

  res.json({ success: true, data: todo });
});

// DELETE /todos/:id — delete a todo
router.delete("/:id", (req: Request, res: Response) => {
  const index = todos.findIndex((t) => t.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: "Todo not found" });
    return;
  }

  todos.splice(index, 1);

  res.json({ success: true, message: "Todo deleted" });
});

export default router;
