import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task"; // Import ITask if needed elsewhere, not strictly needed here
import Subtask from "@/models/Subtask"; // Import the Subtask model
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { getToken, GetUserType } from "@/utils/token";

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

    // 2. Extract Task IDs and Validate Input
    const body = await req.json();
    const taskIds: string[] = body.taskIds; // Add type annotation

    // Validate that taskIds is an array and not empty
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Bad Request: Task IDs must be provided as a non-empty array.",
        },
        { status: 400 }
      );
    }
    // Optional: Add further validation if needed (e.g., check if IDs are valid format)

    // 3. Database Interaction
    await connectToDatabase();

    // --- NEW STEP: Delete associated Subtasks ---
    // Find and delete all subtasks whose parentTaskId is in the list of taskIds to be deleted.
    const deletedSubtasksResult = await Subtask.deleteMany({
      parentTaskId: { $in: taskIds },
    });
    console.log(
      `Deleted ${deletedSubtasksResult.deletedCount} associated subtask(s).`
    ); // Server-side log

    // --- Step 2 (was Step 1): Delete Tasks ---
    // Delete the main tasks from the Task collection.
    const deletedTasksResult = await Task.deleteMany({
      TaskId: { $in: taskIds },
    });

    // Check if any tasks were actually found and deleted
    if (deletedTasksResult.deletedCount === 0) {
      // It's possible subtasks were deleted even if the parent task was already gone,
      // but if the intention was to delete specific tasks and none were found, return 404.
      return NextResponse.json(
        {
          success: false,
          message:
            "Not Found: No tasks found matching the provided IDs for deletion.",
        },
        { status: 404 }
      );
    }

    // --- Step 3 (was Step 2): Update AssignedProjectLog ---
    // Remove the deleted taskIds from the tasksIds array in any relevant logs.
    const updateLogsResult = await AssignedProjectLog.updateMany(
      { tasksIds: { $in: taskIds } }, // Find logs containing any of the deleted task IDs
      { $pull: { tasksIds: { $in: taskIds } } } // Remove all matching task IDs from the array
    );
    console.log(`Updated ${updateLogsResult.modifiedCount} assignment log(s).`); // Server-side log

    // 4. Success Response
    return NextResponse.json(
      {
        success: true,
        message: `${deletedTasksResult.deletedCount} task(s) and ${deletedSubtasksResult.deletedCount} associated subtask(s) deleted successfully.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting selected tasks and subtasks:", error);
    let message = "Failed to delete selected tasks.";
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
