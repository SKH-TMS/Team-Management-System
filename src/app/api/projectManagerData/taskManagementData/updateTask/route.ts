// src/app/api/projectManagerData/taskManagementData/updateTask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod"; // For validation
import { connectToDatabase } from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task"; // Task model
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs"; // For authorization check
import { getToken, GetUserType, GetUserId } from "@/utils/token";
// Removed unused imports: Team, updateTaskSchema (will define a new one)

// Define Zod schema for the expected request body for updating
const UpdateTaskPayloadSchema = z.object({
  taskId: z.string().trim().min(1, { message: "Task ID is required." }),
  title: z.string().trim().min(1, { message: "Title is required." }),
  description: z
    .string()
    .trim()
    .min(1, { message: "Description is required." }),
  deadline: z.string().datetime({ message: "Invalid deadline format (ISO)." }),
  // REMOVED: assignedTo, gitHubUrl, context are not updated here by PM
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
    const userType = await GetUserType(token);
    if (userType !== "ProjectManager") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: User is not a Project Manager.",
        },
        { status: 403 }
      );
    }
    const projectManagerId = await GetUserId(token);
    if (!projectManagerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID not found in token.",
        },
        { status: 401 }
      );
    }

    // 2. Parse and Validate Request Body
    const body = await req.json();
    const validationResult = UpdateTaskPayloadSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: `Validation Error: ${errorMessages}` },
        { status: 400 }
      );
    }

    // Use validated data
    const { taskId, title, description, deadline } = validationResult.data;

    // 3. Database Connection
    await connectToDatabase();

    // 4. Authorization Check: Verify PM owns the assignment this task belongs to
    const log: IAssignedProjectLog | null = await AssignedProjectLog.findOne({
      tasksIds: taskId, // Find the log containing this task ID
    });

    if (!log || log.assignedBy !== projectManagerId) {
      // If log not found OR the PM who assigned it doesn't match the current user
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not authorized to update this task.",
        },
        { status: 403 }
      );
    }

    // 5. Find and Update the Task
    const updatedTask: ITask | null = await Task.findOneAndUpdate(
      { TaskId: taskId }, // Find by TaskId
      {
        // Use $set to update only specified fields
        $set: {
          title: title,
          description: description,
          deadline: new Date(deadline), // Convert ISO string to Date
          // DO NOT update status, assignedTo, gitHubUrl, context, subTasks here
        },
      },
      { new: true } // Return the updated document
    );

    // 6. Check if Task was Found and Updated
    if (!updatedTask) {
      return NextResponse.json(
        { success: false, message: "Not Found: Task not found." },
        { status: 404 }
      );
    }

    // 7. Success Response
    return NextResponse.json({
      success: true,
      message: "Task updated successfully.",
      task: updatedTask.toObject(), // Return plain object
    });
  } catch (error) {
    console.error("Error updating task:", error);
    let message = "Failed to update task.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
