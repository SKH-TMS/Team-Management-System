import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { getToken, GetUserRole } from "@/utils/token";
export async function POST(req: NextRequest) {
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
    const { taskIds } = await req.json();

    if (!taskIds || taskIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "No tasks selected for deletion." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const deletedTasks = await Task.deleteMany({ TaskId: { $in: taskIds } });

    await AssignedProjectLog.updateMany(
      { tasksIds: { $in: taskIds } },
      { $pull: { tasksIds: { $in: taskIds } } }
    );

    if (deletedTasks.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "No tasks were deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${deletedTasks.deletedCount} task(s) deleted successfully.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting selected tasks:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete tasks." },
      { status: 500 }
    );
  }
}
