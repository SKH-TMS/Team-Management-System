import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task"; // Import ITask interface
import { getToken, GetUserType } from "@/utils/token";

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
    const userType = await GetUserType(token); // Renamed variable
    if (userType !== "ProjectManager") {
      // Use 403 Forbidden for wrong role
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: User is not a Project Manager.",
        },
        { status: 403 }
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

    // 3. Database Interaction
    await connectToDatabase();

    // Fetch the task by TaskId - Add type annotation
    const task: ITask | null = await Task.findOne({ TaskId: taskId });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Not Found: Task not found." },
        { status: 404 }
      );
    }

    // 4. Validate Current Task Status
    // Ensure the task status is "In Progress" before allowing completion by PM
    // This implies the PM is approving a submitted task.
    if (task.status !== "In Progress") {
      return NextResponse.json(
        {
          success: false,
          message: `Bad Request: Only tasks currently 'In Progress' can be marked as completed by the Project Manager. Current status: ${task.status}.`,
        },
        { status: 400 }
      );
    }

    // 5. Update Task Status
    task.status = "Completed";
    // task.updatedAt = new Date(); // REMOVED: Mongoose handles this via timestamps

    await task.save(); // Save the task with the updated status

    // 6. Success Response
    return NextResponse.json({
      success: true,
      message: "Task marked as 'Completed' successfully.",
    });
  } catch (error) {
    console.error("Error marking task as completed:", error);
    let message = "Failed to mark task as completed.";
    // Basic check if it's an error object
    if (typeof error === "object" && error !== null && "message" in error) {
      if (typeof error.message === "string") {
        // Log more specific error server-side
        console.error(`Specific error: ${error.message}`);
      }
    }
    return NextResponse.json(
      { success: false, message: message }, // Keep generic message for client
      { status: 500 }
    );
  }
}
