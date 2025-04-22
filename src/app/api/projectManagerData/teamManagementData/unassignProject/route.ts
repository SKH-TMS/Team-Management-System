import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Task from "@/models/Task";
import { getToken, GetUserId, GetUserType } from "@/utils/token";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }
    const userType = await GetUserType(token);
    if (userType !== "ProjectManager") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access, you are not a Project Manager.",
        },
        { status: 401 }
      );
    }
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. User ID not found.",
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { teamId, projectIds } = await req.json();
    if (!teamId || !projectIds || !Array.isArray(projectIds)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request body. 'teamId' and 'projectIds' (as an array) are required.",
        },
        { status: 400 }
      );
    }

    const logs = await AssignedProjectLog.find({
      teamId,
      projectId: { $in: projectIds },
    });

    const tasksToDelete = logs.reduce((acc: string[], log) => {
      if (log.tasksIds && log.tasksIds.length > 0) {
        return [...acc, ...log.tasksIds];
      }
      return acc;
    }, []);

    if (tasksToDelete.length > 0) {
      await Task.deleteMany({ TaskId: { $in: tasksToDelete } });
    }

    await AssignedProjectLog.deleteMany({
      teamId,
      projectId: { $in: projectIds },
    });

    return NextResponse.json({
      success: true,
      message: "Projects unassigned successfully.",
    });
  } catch (error) {
    console.error("Error unassigning projects:", error);
    return NextResponse.json(
      { success: false, message: "Error unassigning projects." },
      { status: 500 }
    );
  }
}
