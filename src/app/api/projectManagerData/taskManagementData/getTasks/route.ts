export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Task from "@/models/Task";
import Project from "@/models/Project";
import Team from "@/models/Team";
import User from "@/models/User"; // Added missing import
import { getToken, GetUserType, GetUserId } from "@/utils/token";

export async function GET(req: NextRequest) {
  try {
    // Verify token and that the user is a ProjectManager.
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
        { success: false, message: "You are not a ProjectManager." },
        { status: 401 }
      );
    }
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. User ID not found." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get all assignment logs created by this project manager.
    const logs = await AssignedProjectLog.find({ assignedBy: userId });

    // For each log, retrieve the referenced tasks along with the assignment details.
    const tasksWithAssignment = await Promise.all(
      logs.map(async (log) => {
        // Look up the project and team to get their names.
        const project = await Project.findOne({ ProjectId: log.projectId });
        const team = await Team.findOne({ teamId: log.teamId });
        // Fetch tasks referenced in this log.
        const tasksInLog = await Task.find({ TaskId: { $in: log.tasksIds } });
        // For each task, merge assignment details.
        return tasksInLog.map((task) => ({
          ...task.toObject(),
          projectId: log.projectId,
          projectName: project ? project.title : "",
          teamId: log.teamId,
          teamName: team ? team.teamName : "",
        }));
      })
    );

    // Flatten the results (since tasksWithAssignment is an array of arrays).
    const flattenedTasks = tasksWithAssignment.flat();

    // Compute assigned user IDs from the flattened tasks.
    const assignedUserIds = Array.from(
      new Set(flattenedTasks.flatMap((task: any) => task.assignedTo))
    );
    let members: any[] = [];
    if (assignedUserIds.length > 0) {
      members = await User.find({ UserId: { $in: assignedUserIds } });
    }

    // Gather unique submittedby user IDs from tasks.
    const submittedUserIds = Array.from(
      new Set(
        flattenedTasks
          .map((task: any) => task.submittedby)
          .filter((id: string) => id && id !== "Not-submitted")
      )
    );
    let submitters: any[] = [];
    if (submittedUserIds.length > 0) {
      submitters = await User.find({ UserId: { $in: submittedUserIds } });
    }

    return NextResponse.json({
      success: true,
      tasks: flattenedTasks,
      // Optionally, you may return members and submitters:
      members,
      submitters,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch tasks." },
      { status: 500 }
    );
  }
}
