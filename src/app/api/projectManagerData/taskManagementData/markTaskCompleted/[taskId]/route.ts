import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import { getToken, GetUserType } from "@/utils/token";

export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }
    const usertype = await GetUserType(token);
    if (usertype !== "ProjectManager") {
      return NextResponse.json(
        { success: false, message: "You are not a projectManager." },
        { status: 401 }
      );
    }
    const { taskId } = params;
    // Connect to the database
    await connectToDatabase();

    // Fetch the task by TaskId
    const task = await Task.findOne({ TaskId: taskId });
    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: "Task not found.",
        },
        { status: 404 }
      );
    }

    // Ensure the task status is "In Progress" before allowing the status change to "Completed"
    if (task.status !== "In Progress") {
      return NextResponse.json(
        {
          success: false,
          message: "Only tasks in 'In Progress' can be marked as completed.",
        },
        { status: 400 }
      );
    }

    // Update the task status to "Completed"
    task.status = "Completed";
    task.updatedAt = new Date();

    await task.save(); // Save the task with the updated status

    return NextResponse.json({
      success: true,
      message: "Task marked as completed successfully.",
    });
  } catch (error) {
    console.error("Error marking task as completed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark task as completed.",
      },
      { status: 500 }
    );
  }
}
