// src/app/api/projectManagerData/taskManagementData/getTaskDetails/[taskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task"; // Import ITask
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs"; // Import interface
import { getToken, GetUserType, GetUserId } from "@/utils/token";
// Removed unused imports: Team, User

export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
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
    const projectManagerId = await GetUserId(token); // Get the logged-in PM's ID
    if (!projectManagerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID not found in token.",
        },
        { status: 401 }
      );
    }

    // 2. Extract Task ID
    const { taskId } = params;
    if (!taskId) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Task ID is missing." },
        { status: 400 }
      );
    }

    // Optional: Extract projectId from body if sent for verification, but not strictly needed if checking via log
    // const { projectId } = await req.json();

    // 3. Database Connection
    await connectToDatabase();

    // 4. Find the Task
    const task: ITask | null = await Task.findOne({ TaskId: taskId });
    if (!task) {
      return NextResponse.json(
        { success: false, message: "Not Found: Task not found." },
        { status: 404 }
      );
    }

    // 5. Authorization Check: Verify PM owns the assignment this task belongs to
    const log: IAssignedProjectLog | null = await AssignedProjectLog.findOne({
      tasksIds: taskId, // Find the log containing this task ID
    });

    if (!log || log.assignedBy !== projectManagerId) {
      // If log not found OR the PM who assigned it doesn't match the current user
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You are not authorized to view this task's details.",
        },
        { status: 403 }
      );
    }

    // 6. REMOVED: Logic to fetch Team and Members

    // 7. Success Response
    return NextResponse.json({
      success: true,
      task: task.toObject(), // Return the plain task object
      // REMOVED: members array
    });
  } catch (error) {
    console.error("Error fetching task details:", error);
    let message = "Failed to fetch task details.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
