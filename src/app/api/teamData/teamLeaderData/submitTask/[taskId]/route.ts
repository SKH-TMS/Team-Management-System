// src/app/api/teamData/teamLeaderData/submitTask/[taskId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task";
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs";
import Team, { ITeam } from "@/models/Team";
import { getToken, GetUserId } from "@/utils/token";

// Zod schema for submission payload
const SubmitTaskSchema = z.object({
  gitHubUrl: z.string().url({ message: "Invalid GitHub URL format." }).trim(),
  context: z.string().trim().optional(), // Context is optional
});

export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // 1. Extract Task ID
    const { taskId } = params;
    if (!taskId) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Task ID is missing." },
        { status: 400 }
      );
    }

    // 2. Authentication & Authorization (Verify Team Leadership)
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID not found in token.",
        },
        { status: 401 }
      );
    }

    // 3. Parse and Validate Request Body
    const body = await req.json();
    const validationResult = SubmitTaskSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: `Validation Error: ${errorMessages}` },
        { status: 400 }
      );
    }
    const { gitHubUrl, context } = validationResult.data;

    // 4. Database Connection
    await connectToDatabase();

    // 5. Find the Task
    const task: ITask | null = await Task.findOne({ TaskId: taskId });
    if (!task) {
      return NextResponse.json(
        { success: false, message: "Not Found: Task not found." },
        { status: 404 }
      );
    }

    // 6. Authorization Check: Ensure the task belongs to a team led by this user
    // Find the log containing the task
    const log: IAssignedProjectLog | null = await AssignedProjectLog.findOne({
      tasksIds: taskId,
    });
    if (!log) {
      // Should not happen if task exists, but good check
      console.error(
        `Data inconsistency: Task ${taskId} found but no corresponding assignment log.`
      );
      return NextResponse.json(
        { success: false, message: "Internal Error: Assignment log missing." },
        { status: 500 }
      );
    }

    // Check if the user leads the team associated with the log
    const isLeader = await Team.exists({
      teamId: log.teamId,
      teamLeader: userId,
    });
    if (!isLeader) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You are not the leader of the team assigned to this task.",
        },
        { status: 403 }
      );
    }

    // 7. Check Task Status (Allow submission for Pending, Re Assigned, In Progress)
    if (task.status === "Completed") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Bad Request: Cannot submit a task that is already completed.",
        },
        { status: 400 }
      );
    }

    // 8. Update Task Fields
    task.status = "In Progress"; // Mark as In Progress upon submission
    task.gitHubUrl = gitHubUrl;
    task.context = context || ""; // Use empty string if context is undefined/null
    task.submittedby = userId; // Record who submitted it
    // Mongoose timestamps will handle updatedAt automatically

    const updatedTask = await task.save();

    // 9. Success Response
    return NextResponse.json({
      success: true,
      message: "Task submitted successfully.",
      task: updatedTask.toObject(), // Return updated task
    });
  } catch (error) {
    console.error("Error submitting task:", error);
    let message = "Failed to submit task.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
