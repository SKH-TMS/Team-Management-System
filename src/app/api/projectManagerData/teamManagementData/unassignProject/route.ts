import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Task, { ITask } from "@/models/Task"; // Assuming ITask interface exists
import Subtask from "@/models/Subtask"; // Import the Subtask model
import { getToken, GetUserId, GetUserType } from "@/utils/token";

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication & Authorization
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
        { status: 403 }
      );
    }

    // 2. Validate Input Body
    const { teamId, projectIds } = await req.json();
    if (
      !teamId ||
      !projectIds ||
      !Array.isArray(projectIds) ||
      projectIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request body. 'teamId' (string) and 'projectIds' (non-empty array) are required.",
        },
        { status: 400 }
      );
    }

    // 3. Connect to Database
    await connectToDatabase();

    // 4. Find Relevant Logs and Collect Task IDs
    const logs = await AssignedProjectLog.find({
      teamId,
      projectId: { $in: projectIds },
    });

    const taskIdsToDeleteSet = new Set<string>();
    logs.forEach((log) => {
      if (log.tasksIds && log.tasksIds.length > 0) {
        // Add explicit type 'string' to taskId parameter
        log.tasksIds.forEach((taskId: string) =>
          taskIdsToDeleteSet.add(taskId)
        );
      }
    });
    const taskIdsToDelete = Array.from(taskIdsToDeleteSet);

    let subtaskIdsToDelete: string[] = [];

    // 5. Find Subtasks associated with the Tasks being deleted
    if (taskIdsToDelete.length > 0) {
      const tasksWithSubtasks = await Task.find(
        { TaskId: { $in: taskIdsToDelete } },
        { subTasks: 1, _id: 0 }
      );

      const subtaskIdsSet = new Set<string>();
      tasksWithSubtasks.forEach((task) => {
        if (Array.isArray(task.subTasks)) {
          // Add explicit type 'string' to subtaskId parameter
          task.subTasks.forEach((subtaskId: string) => {
            if (typeof subtaskId === "string" && subtaskId.length > 0) {
              subtaskIdsSet.add(subtaskId);
            }
          });
        }
      });
      subtaskIdsToDelete = Array.from(subtaskIdsSet);
    }

    // --- Deletion Steps ---

    // 6. Delete Subtasks
    if (subtaskIdsToDelete.length > 0) {
      console.log(
        `Attempting to delete ${subtaskIdsToDelete.length} subtasks...`
      );
      const subtaskDeleteResult = await Subtask.deleteMany({
        SubtaskId: { $in: subtaskIdsToDelete },
      });
      console.log(`Deleted ${subtaskDeleteResult.deletedCount} subtasks.`);
    }

    // 7. Delete Tasks
    if (taskIdsToDelete.length > 0) {
      console.log(`Attempting to delete ${taskIdsToDelete.length} tasks...`);
      const taskDeleteResult = await Task.deleteMany({
        TaskId: { $in: taskIdsToDelete },
      });
      console.log(`Deleted ${taskDeleteResult.deletedCount} tasks.`);
    }

    // 8. Delete Assignment Logs
    if (logs.length > 0) {
      console.log(`Attempting to delete ${logs.length} assignment logs...`);
      const logDeleteResult = await AssignedProjectLog.deleteMany({
        teamId,
        projectId: { $in: projectIds },
      });
      console.log(`Deleted ${logDeleteResult.deletedCount} assignment logs.`);
    }

    // 9. Success Response
    return NextResponse.json({
      success: true,
      message:
        "Projects unassigned and associated tasks/subtasks deleted successfully.",
    });
  } catch (error) {
    console.error("Error unassigning projects:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during project unassignment.";
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
