import { getPool } from "../db/pool.js";

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "in_progress" | "completed";

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: Date | null;
  estimated_minutes: number | null;
  created_at: Date;
  updated_at: Date;
};

export function formatTask(row: TaskRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || null,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date ? row.due_date.toISOString() : null,
    estimatedMinutes: row.estimated_minutes || null,
    createdAt: row.created_at.toISOString(),
  };
}

export async function createTask(input: {
  userId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedMinutes?: number;
}) {
  const result = await getPool().query<TaskRow>(
    `
    INSERT INTO tasks (user_id, title, description, priority, status, due_date, estimated_minutes)
    VALUES ($1, $2, $3, COALESCE($4, 'medium'), 'pending', $5, $6)
    RETURNING *
    `,
    [
      input.userId,
      input.title,
      input.description ?? null,
      input.priority ?? "medium",
      input.dueDate ? new Date(input.dueDate) : null,
      input.estimatedMinutes ?? null,
    ],
  );

  return formatTask(result.rows[0]);
}

export async function listUserTasks(userId: string, statusFilter?: TaskStatus) {
  let query = `
    SELECT id, user_id, title, description, priority, status, due_date, estimated_minutes, created_at, updated_at
    FROM tasks
    WHERE user_id = $1
  `;
  const params: unknown[] = [userId];

  if (statusFilter) {
    params.push(statusFilter);
    query += ` AND status = $2`;
  }

  query += ` ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END ASC, created_at DESC`;

  const result = await getPool().query<TaskRow>(query, params);
  return result.rows.map(formatTask);
}

export async function updateTaskStatus(input: {
  userId: string;
  taskId: string;
  status: TaskStatus;
}) {
  const result = await getPool().query<TaskRow>(
    `
    UPDATE tasks
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND user_id = $3
    RETURNING *
    `,
    [input.status, input.taskId, input.userId],
  );

  if (result.rows.length === 0) {
    throw new Error("Task not found or unauthorized");
  }

  return formatTask(result.rows[0]);
}

export async function deleteTask(input: { userId: string; taskId: string }) {
  await getPool().query(
    `
    DELETE FROM tasks
    WHERE id = $1 AND user_id = $2
    `,
    [input.taskId, input.userId],
  );

  return { success: true, taskId: input.taskId };
}
