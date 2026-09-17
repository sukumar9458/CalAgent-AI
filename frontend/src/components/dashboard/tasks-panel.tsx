"use client";

import { useCallback, useEffect, useState } from "react";
import { Task, fetchTasks, updateTaskStatus, deleteTask } from "@/lib/tasks";
import { Skeleton } from "../ui/skeleton";
import { CheckCircle2, Circle, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

function priorityBadge(priority: Task["priority"]) {
  if (priority === "high")
    return (
      <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">
        High
      </span>
    );
  if (priority === "medium")
    return (
      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
        Medium
      </span>
    );
  return (
    <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
      Low
    </span>
  );
}

export default function TasksPanel({ sessionToken }: { sessionToken: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTasks(sessionToken);
      setTasks(data);
    } catch {
      console.log("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  async function handleToggleStatus(task: Task) {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );

    try {
      await updateTaskStatus(sessionToken, task.id, newStatus);
    } catch {
      loadTasks();
    }
  }

  async function handleDeleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteTask(sessionToken, taskId);
    } catch {
      loadTasks();
    }
  }

  const pendingCount = tasks.filter((t) => t.status !== "completed").length;

  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            ACTION ITEMS & TASKS
          </p>
          <span className="flex size-4 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-700">
            {pendingCount || tasks.length}
          </span>
        </div>

        <Button
          size="icon-sm"
          variant="ghost"
          className="size-6 shrink-0 text-neutral-400 hover:text-neutral-700"
          disabled={loading}
          onClick={loadTasks}
        >
          <RefreshCcw className={cn("size-3", loading && "animate-spin")} />
        </Button>
      </div>

      {loading && tasks.length === 0 ? (
        <Skeleton className="h-16 w-full rounded-xl" />
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-white/60 p-3 text-center text-xs text-neutral-500">
          No action items. Paste meeting notes into chat!
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5">
          {tasks.map((task, idx) => {
            const isCompleted = task.status === "completed";
            const mockSubtitle = idx === 0 ? "Due Friday" : "Sarah";

            return (
              <div
                key={task.id}
                className={cn(
                  "group relative flex items-start gap-2.5 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-2xs transition-all hover:border-neutral-300",
                  isCompleted && "opacity-60 bg-neutral-50",
                )}
              >
                <button
                  type="button"
                  className="mt-0.5 text-neutral-400 hover:text-emerald-600 transition-colors"
                  onClick={() => handleToggleStatus(task)}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-4 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                </button>

                <div className="min-w-0 flex-1 space-y-1">
                  <p
                    className={cn(
                      "text-xs font-semibold text-neutral-900 leading-snug",
                      isCompleted && "line-through text-neutral-500",
                    )}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2">
                    {priorityBadge(task.priority)}
                    <span className="text-[11px] font-medium text-neutral-500">
                      {task.description || mockSubtitle}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-600 transition-opacity"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
