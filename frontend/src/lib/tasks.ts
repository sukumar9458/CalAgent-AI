import { apiFetch } from "./api";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  dueDate: string | null;
  estimatedMinutes: number | null;
  createdAt: string;
};

export async function fetchTasks(token: string) {
  const data = await apiFetch<{ tasks: Task[] }>("/api/tasks", { token });
  return data.tasks;
}

export async function updateTaskStatus(
  token: string,
  taskId: string,
  status: "pending" | "in_progress" | "completed",
) {
  const data = await apiFetch<{ task: Task }>(`/api/tasks/${taskId}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
  return data.task;
}

export async function deleteTask(token: string, taskId: string) {
  await apiFetch(`/api/tasks/${taskId}`, {
    method: "DELETE",
    token,
  });
}
