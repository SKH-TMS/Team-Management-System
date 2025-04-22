import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import { getToken, GetUserId, GetUserRole } from "@/utils/token";

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

    if (task.status !== "In Progress") {
      return NextResponse.json(
        {
          success: false,
          message: "Only tasks in 'In Progress' can be marked as completed.",
        },
        { status: 400 }
      );
    }

    task.status = "Completed";
    task.updatedAt = new Date();

    await task.save();

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
