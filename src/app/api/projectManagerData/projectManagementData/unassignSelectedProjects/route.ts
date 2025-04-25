import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Task from "@/models/Task";
import Project from "@/models/Project";
import { getToken, GetUserId, GetUserType } from "@/utils/token";
import Subtask from "@/models/Subtask";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
    const userType = await GetUserType(token); // Renamed variable
    if (userType !== "ProjectManager") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: User is not a Project Manager.",
        },
        { status: 403 }
      );
    }
    const projectManagerId = await GetUserId(token); // Use PM ID for authorization
    if (!projectManagerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID not found in token.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const projectIds: string[] = body.projectIds; // Add type annotation

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Bad Request: Project IDs must be provided as a non-empty array.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const assignedLogs = await AssignedProjectLog.find({
      projectId: { $in: projectIds },
      assignedBy: projectManagerId, // Authorization check
    });

    if (!assignedLogs || assignedLogs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Not Found or Forbidden: No assignments found for the specified projects managed by you.",
        },
        { status: 404 } // Or 403
      );
    }

    const allTaskIds = assignedLogs.reduce<string[]>((acc, log) => {
      // Ensure tasksIds exists and is an array before concatenating
      if (log.tasksIds && Array.isArray(log.tasksIds)) {
        return acc.concat(log.tasksIds);
      }
      return acc;
    }, []);

    let deletedTasksCount = 0;
    let deletedSubtasksCount = 0;

    if (allTaskIds.length > 0) {
      const deletedSubtasksResult = await Subtask.deleteMany({
        parentTaskId: { $in: allTaskIds },
      });
      deletedSubtasksCount = deletedSubtasksResult.deletedCount;
      console.log(`Deleted ${deletedSubtasksCount} associated subtask(s).`);

      // Delete Tasks
      const deletedTasksResult = await Task.deleteMany({
        TaskId: { $in: allTaskIds },
      });
      deletedTasksCount = deletedTasksResult.deletedCount;
      console.log(`Deleted ${deletedTasksCount} associated task(s).`);
    } else {
      console.log("No tasks were associated with these assignments.");
    }

    const projectUpdateResult = await Project.updateMany(
      { ProjectId: { $in: projectIds } }, // Find projects by their IDs
      { $set: { status: "Pending" } } // Set their status to Pending
    );
    console.log(
      `Updated status for ${projectUpdateResult.modifiedCount} project(s).`
    );

    const logIdsToDelete = assignedLogs.map((log) => log._id);
    const deletedAssignedLogsResult = await AssignedProjectLog.deleteMany({
      _id: { $in: logIdsToDelete },
    });

    if (deletedAssignedLogsResult.deletedCount === 0) {
      // This shouldn't happen if we found logs earlier, indicates a potential issue
      console.error(
        "Inconsistency: Found assignment logs but failed to delete them."
      );
      // Still proceed, but maybe log this as a server error
    }

    return NextResponse.json({
      success: true,
      message: `${deletedAssignedLogsResult.deletedCount} project assignment(s) removed, ${deletedTasksCount} task(s) and ${deletedSubtasksCount} subtask(s) deleted, and project status updated.`,
    });
  } catch (error) {
    console.error("Error unassigning projects:", error);
    let message = "Failed to unassign projects.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
