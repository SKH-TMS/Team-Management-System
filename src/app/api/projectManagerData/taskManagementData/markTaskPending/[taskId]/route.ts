import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import { getToken, GetUserType } from "@/utils/token";
import { MarkPendingTaskSchema } from "@/schemas/taskSchema";

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
    const { feedback } = await req.json();
    if (!feedback) {
      return NextResponse.json(
        {
          success: false,
          message: "Plesae Provide feedback ",
        },
        { status: 404 }
      );
    }

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
    const validatedData = MarkPendingTaskSchema.safeParse({
      context: feedback,
    });
    if (!validatedData.success) {
      // If validation fails, return an error with the validation message
      const errorMessages = validatedData.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: errorMessages },
        { status: 400 }
      );
    }
    // Update the task status to "Pending"
    task.status = "Re Assigned";
    task.gitHubUrl = "";
    task.context = feedback;
    task.submittedby = "Not-submitted";
    task.updatedAt = new Date();

    await task.save(); // Save the task with the updated status

    return NextResponse.json({
      success: true,
      message: "Task marked as Pending successfully.",
    });
  } catch (error) {
    console.error("Error marking task as Pending:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark task as Pending.",
      },
      { status: 500 }
    );
  }
}
