import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import { getToken, GetUserId, GetUserRole } from "@/utils/token";
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

    const userrole = GetUserRole(token);
    let isverified = false;
    if (userrole && userrole.includes("TeamLeader")) {
      isverified = true;
    }
    if (!isverified) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a TeamLeader.",
        },
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

    await connectToDatabase();

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
      const errorMessages = validatedData.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: errorMessages },
        { status: 400 }
      );
    }
    task.status = "Re Assigned";
    task.gitHubUrl = "";
    task.context = feedback;
    task.submittedby = "Not-submitted";
    task.updatedAt = new Date();

    await task.save();

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
