import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(100, "Task title must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Task description is required")
    .max(500, "Task description must be less than 500 characters"),
  // Expecting assignedTo to be an array of strings matching "User-<number>"
  assignedTo: z
    .array(
      z
        .string()
        .regex(
          /^User-(\d+)$/,
          "Each assigned user ID must be in the format 'User-<number>'"
        )
        .optional()
    )
    .optional(),
  assignedTosingle: z
    .string()
    .regex(
      /^User-(\d+)$/,
      "assigned user ID must be in the format 'User-<number>'"
    )
    .optional(),
  // Assuming the assignedTo follows the "User-<number>" pattern
  status: z
    .enum(["Pending", "In Progress", "Completed", "Re Assigned"], {
      errorMap: () => ({
        message:
          "Invalid status. Allowed values are: Pending, In Progress, Completed.",
      }),
    })
    .default("Pending"), // Default status is "Pending"
  deadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format for deadline",
    })
    .transform((val) => new Date(val)), // Transform string into Date
});

// Schema for task updates
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(100, "Task title must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .min(1, "Task description is required")
    .max(500, "Task description must be less than 500 characters")
    .optional(),
  status: z
    .enum(["Pending", "In Progress", "Completed", "Re Assigned"], {
      errorMap: () => ({
        message:
          "Invalid status. Allowed values are: Pending, In Progress, Completed.",
      }),
    })
    .optional(),
  deadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format for deadline",
    })
    .transform((val) => new Date(val))
    .optional(),
  assignedTo: z
    .array(
      z
        .string()
        .regex(
          /^User-(\d+)$/,
          "Each assigned user ID must be in the format 'User-<number>'"
        )
        .optional()
    )
    .optional(),
  assignedTosingle: z
    .string()
    .regex(
      /^User-(\d+)$/,
      "assigned user ID must be in the format 'User-<number>'"
    )
    .optional(),
  gitHubUrl: z
    .string()
    .regex(
      /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_.-]+)?\/?$/,
      "githubURL is not correct"
    )
    .optional(),
  context: z
    .string()
    .min(5, "Detail should include more then 5 characters ")
    .max(100, "Detail must be less than 100 characters")
    .optional(),
});
// Schema for task performing
export const performTaskSchema = z.object({
  TaskId: z
    .string()
    .regex(/^Task-(\d+)$/, "Task-ID must be in the format 'Task-<number>'"),
  gitHubUrl: z
    .string()
    .regex(
      /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_.-]+)?\/?$/,
      "githubURL is not correct"
    ),
  context: z
    .string()
    .min(5, "Detail should include more then 5 characters ")
    .max(100, "Detail must be less than 100 characters")
    .optional(),
  submittedby: z
    .string()
    .regex(
      /^User-(\d+)$/,
      "Sumbmiter user-ID must be in the format 'User-<number>'"
    ),
  status: z
    .enum(["Pending", "In Progress", "Completed", "Re Assigned"], {
      errorMap: () => ({
        message:
          "Invalid status. Allowed values are: Pending, In Progress, Completed.",
      }),
    })
    .optional(),
  deadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format for deadline",
    })
    .transform((val) => new Date(val))
    .optional(),
});
export const MarkPendingTaskSchema = z.object({
  context: z
    .string()
    .min(5, "Detail should include more then 5 characters ")
    .max(100, "Detail must be less than 100 characters")
    .optional(),
  status: z
    .enum(["Pending", "In Progress", "Completed", "Re Assigned"], {
      errorMap: () => ({
        message:
          "Invalid status. Allowed values are: Pending, In Progress, Completed.",
      }),
    })
    .optional(),
  deadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format for deadline",
    })
    .transform((val) => new Date(val))
    .optional(),
});
