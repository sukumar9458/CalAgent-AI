import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/requireSession.js";
import {
  createTask,
  deleteTask,
  listUserTasks,
  updateTaskStatus,
  TaskPriority,
  TaskStatus,
} from "../repositories/task.repository.js";

export const taskRouter = Router();

taskRouter.use(requireSession);

taskRouter.get("/", async (req, res) => {
  try {
    const statusFilter =
      typeof req.query.status === "string" &&
      ["pending", "in_progress", "completed"].includes(req.query.status)
        ? (req.query.status as TaskStatus)
        : undefined;

    const auth = (req as any).auth;
    const tasks = await listUserTasks(auth.userId, statusFilter);
    res.json({ tasks });
  } catch (error) {
    console.error("Error listing tasks:", error);
    res.status(500).json({ error: "Could not load tasks" });
  }
});

const createTaskSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional(),
  estimatedMinutes: z.number().int().optional(),
});

taskRouter.post("/", async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid task data" });
    return;
  }

  try {
    const auth = (req as any).auth;
    const task = await createTask({
      userId: auth.userId,
      ...parsed.data,
      priority: parsed.data.priority as TaskPriority,
    });
    res.json({ task });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Could not create task" });
  }
});

const updateStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed"]),
});

taskRouter.patch("/:id/status", async (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  try {
    const auth = (req as any).auth;
    const task = await updateTaskStatus({
      userId: auth.userId,
      taskId: req.params.id,
      status: parsed.data.status as TaskStatus,
    });
    res.json({ task });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ error: "Could not update task" });
  }
});

taskRouter.delete("/:id", async (req, res) => {
  try {
    const auth = (req as any).auth;
    const result = await deleteTask({
      userId: auth.userId,
      taskId: req.params.id,
    });
    res.json(result);
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Could not delete task" });
  }
});
