// src/app/api/projectManagerData/teamManagementData/deleteTeams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Task, { ITask } from "@/models/Task"; // Assuming ITask interface exists
import Subtask from "@/models/Subtask"; // Import the Subtask model
import { getToken, GetUserId, GetUserType } from "@/utils/token";
import mongoose from "mongoose"; // Import mongoose if needed for types

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
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. User ID not found." },
        { status: 401 }
      );
    }
    const userType = await GetUserType(token);
    if (!userType || userType !== "ProjectManager") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: User is not a Project Manager.",
        },
        { status: 403 } // Use 403 Forbidden
      );
    }

    // 2. Validate Input Body
    const { teamIds } = await req.json();
    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Bad Request: 'teamIds' must be provided as a non-empty array.",
        },
        { status: 400 }
      );
    }

    // 3. Connect to Database
    await connectToDatabase();

    // 4. Verify Ownership (Optional but Recommended)
    // Ensure the PM owns the teams they are trying to delete
    const teamsToDelete = await Team.find({
      teamId: { $in: teamIds },
      createdBy: userId, // Check ownership
    }).select("teamId"); // Only select necessary field

    const ownedTeamIds = teamsToDelete.map((t) => t.teamId);

    if (ownedTeamIds.length !== teamIds.length) {
      const missingIds = teamIds.filter((id) => !ownedTeamIds.includes(id));
      console.warn(
        `PM ${userId} attempted to delete teams they don't own or that don't exist: ${missingIds.join(", ")}`
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You can only delete teams you created, or some teams were not found.",
        },
        { status: 403 }
      );
    }

    // 5. Find Relevant Logs and Collect Task IDs for the owned teams
    const logs = await AssignedProjectLog.find({
      teamId: { $in: ownedTeamIds }, // Use only owned team IDs
    });

    const taskIdsToDeleteSet = new Set<string>();
    logs.forEach((log) => {
      if (log.tasksIds && log.tasksIds.length > 0) {
        log.tasksIds.forEach((taskId: string) =>
          taskIdsToDeleteSet.add(taskId)
        );
      }
    });
    const taskIdsToDelete = Array.from(taskIdsToDeleteSet);

    let subtaskIdsToDelete: string[] = [];
    let deletedSubtasksCount = 0;
    let deletedTasksCount = 0;

    // 6. Find Subtasks associated with the Tasks being deleted
    if (taskIdsToDelete.length > 0) {
      const tasksWithSubtasks = await Task.find(
        { TaskId: { $in: taskIdsToDelete } },
        { subTasks: 1, _id: 0 }
      );

      const subtaskIdsSet = new Set<string>();
      tasksWithSubtasks.forEach((task) => {
        if (Array.isArray(task.subTasks)) {
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

    // 7. Delete Subtasks
    if (subtaskIdsToDelete.length > 0) {
      console.log(
        `Attempting to delete ${subtaskIdsToDelete.length} subtasks associated with deleted teams...`
      );
      const subtaskDeleteResult = await Subtask.deleteMany({
        SubtaskId: { $in: subtaskIdsToDelete },
      });
      deletedSubtasksCount = subtaskDeleteResult.deletedCount;
      console.log(`Deleted ${deletedSubtasksCount} subtasks.`);
    }

    // 8. Delete Tasks
    if (taskIdsToDelete.length > 0) {
      console.log(
        `Attempting to delete ${taskIdsToDelete.length} tasks associated with deleted teams...`
      );
      const taskDeleteResult = await Task.deleteMany({
        TaskId: { $in: taskIdsToDelete },
      });
      deletedTasksCount = taskDeleteResult.deletedCount;
      console.log(`Deleted ${deletedTasksCount} tasks.`);
    }

    // 9. Delete Assignment Logs for the owned teams
    let deletedLogsCount = 0;
    if (logs.length > 0) {
      console.log(
        `Attempting to delete ${logs.length} assignment logs for deleted teams...`
      );
      const logDeleteResult = await AssignedProjectLog.deleteMany({
        teamId: { $in: ownedTeamIds }, // Ensure we only delete logs for owned teams
      });
      deletedLogsCount = logDeleteResult.deletedCount;
      console.log(`Deleted ${deletedLogsCount} assignment logs.`);
    }

    // 10. Delete Teams (owned by the user)
    console.log(`Attempting to delete ${ownedTeamIds.length} teams...`);
    const teamDeleteResult = await Team.deleteMany({
      teamId: { $in: ownedTeamIds }, // Use ownedTeamIds from step 4
      createdBy: userId,
    });
    console.log(`Deleted ${teamDeleteResult.deletedCount} teams.`);

    // 11. Success Response
    return NextResponse.json({
      success: true,
      message: `${teamDeleteResult.deletedCount} team(s), ${deletedLogsCount} assignment log(s), ${deletedTasksCount} task(s), and ${deletedSubtasksCount} subtask(s) deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting teams:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during team deletion.";
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
