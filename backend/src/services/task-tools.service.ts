import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ensureUser } from "../repositories/user.repository.js";
import {
  createTask,
  listUserTasks,
  updateTaskStatus,
  TaskPriority,
  TaskStatus,
} from "../repositories/task.repository.js";

async function getInternalUserId(authUserId: string) {
  const user = await ensureUser({ authUserId });
  return user.id;
}

export function createTaskTools(authUserId: string) {
  return {
    extractAndSaveActionItems: createTool({
      id: "extractAndSaveActionItems",
      description:
        "Extract action items / tasks from meeting notes or text and save them into the database.",
      inputSchema: z.object({
        actionItems: z.array(
          z.object({
            title: z.string().describe("Task or action item title"),
            description: z
              .string()
              .optional()
              .describe("Context or summary of the task"),
            priority: z
              .enum(["low", "medium", "high"])
              .optional()
              .describe("Task priority: low, medium, or high"),
            dueDate: z
              .string()
              .optional()
              .describe("Due date as ISO-8601 string if mentioned"),
            estimatedMinutes: z
              .number()
              .int()
              .optional()
              .describe("Estimated time to complete task in minutes"),
          }),
        ),
      }),
      execute: async ({ actionItems }) => {
        const userId = await getInternalUserId(authUserId);
        const createdTasks = [];

        for (const item of actionItems) {
          const task = await createTask({
            userId,
            title: item.title,
            description: item.description,
            priority: (item.priority as TaskPriority) ?? "medium",
            dueDate: item.dueDate,
            estimatedMinutes: item.estimatedMinutes,
          });
          createdTasks.push(task);
        }

        return {
          success: true,
          count: createdTasks.length,
          tasks: createdTasks,
        };
      },
    }),

    listUserTasks: createTool({
      id: "listUserTasks",
      description:
        "List all action items / tasks for the user. Optionally filter by status (pending, in_progress, completed).",
      inputSchema: z.object({
        status: z
          .enum(["pending", "in_progress", "completed"])
          .optional()
          .describe("Filter tasks by status"),
      }),
      execute: async ({ status }) => {
        const userId = await getInternalUserId(authUserId);
        const tasks = await listUserTasks(userId, status as TaskStatus);
        return { count: tasks.length, tasks };
      },
    }),

    updateTaskStatusTool: createTool({
      id: "updateTaskStatusTool",
      description: "Update a task's status (pending, in_progress, completed).",
      inputSchema: z.object({
        taskId: z.string().uuid().describe("Task ID to update"),
        status: z.enum(["pending", "in_progress", "completed"]),
      }),
      execute: async ({ taskId, status }) => {
        const userId = await getInternalUserId(authUserId);
        const updated = await updateTaskStatus({
          userId,
          taskId,
          status: status as TaskStatus,
        });
        return { success: true, task: updated };
      },
    }),
  };
}
