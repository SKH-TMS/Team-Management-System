import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task"; // Import ITask interface
import { getToken, GetUserType } from "@/utils/token";
import { MarkPendingTaskSchema } from "@/schemas/taskSchema"; // Assuming this schema validates { context: string }

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
    const userType = await GetUserType(token); // Renamed variable for clarity
    if (userType !== "ProjectManager") {
      // Use 403 Forbidden if authenticated but wrong role
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: User is not a Project Manager.",
        },
        { status: 403 }
      );
    }

    // 2. Extract Data and Basic Validation
    const { taskId } = params;
    if (!taskId) {
      // Should generally not happen with file-based routing, but good practice
      return NextResponse.json(
        { success: false, message: "Bad Request: Task ID is missing." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const feedback = body.feedback; // Extract feedback

    if (!feedback || typeof feedback !== "string" || feedback.trim() === "") {
      // Check if feedback is missing, not a string, or empty after trimming
      return NextResponse.json(
        { success: false, message: "Bad Request: Feedback is required." },
        { status: 400 } // Changed from 404 to 400
      );
    }

    // 3. Validate Feedback using Schema (Maps feedback to context)
    const validatedData = MarkPendingTaskSchema.safeParse({
      context: feedback, // Validate the feedback as 'context'
    });

    if (!validatedData.success) {
      const errorMessages = validatedData.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: `Validation Error: ${errorMessages}` },
        { status: 400 }
      );
    }

    // 4. Database Interaction
    await connectToDatabase();

    // Fetch the task by TaskId - Add type annotation
    const task: ITask | null = await Task.findOne({ TaskId: taskId });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Not Found: Task not found." },
        { status: 404 }
      );
    }

    // 5. Update Task Fields
    task.status = "Re Assigned"; // Set status
    task.gitHubUrl = undefined; // Clear GitHub URL (use undefined for cleaner removal)
    task.context = feedback; // Use validated feedback as context
    task.submittedby = "Not-submitted"; // Reset submitter
    // task.updatedAt = new Date(); // REMOVED: Mongoose handles this via timestamps

    await task.save(); // Save the updated task

    // 6. Success Response
    return NextResponse.json({
      success: true,
      message: "Task marked as 'Re Assigned' successfully.",
    });
  } catch (error) {
    console.error("Error marking task as pending:", error);
    let message = "Failed to mark task as pending.";
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
