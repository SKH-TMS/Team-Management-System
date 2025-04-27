// src/app/api/teamData/teamLeaderData/deleteSubtasksBatch/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb"; // Your DB connection utility
import Subtask, { ISubtask } from "@/models/Subtask"; // Your Subtask Mongoose model
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs"; // Your Log model
import Team, { ITeam } from "@/models/Team"; // Your Team model
import { getToken, GetUserId } from "@/utils/token"; // Your auth utilities

// Zod schema for the expected request body
const DeleteSubtasksBatchSchema = z.object({
  subtaskIds: z
    .array(z.string().min(1, "Subtask ID cannot be empty"))
    .min(1, "At least one Subtask ID must be provided"),
});

export async function DELETE(req: NextRequest) {
  try {
    // 1. Authentication
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID not found in token.",
        },
        { status: 401 }
      );
    }

    // 2. Parse and Validate Request Body
    let parsedBody;
    try {
      const body = await req.json();
      parsedBody = DeleteSubtasksBatchSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, message: "Invalid input.", errors: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }
    const { subtaskIds } = parsedBody;

    // 3. Database Connection
    await connectToDatabase();

    // 4. Authorization Check

    // Find the subtasks to get their parent task IDs
    // Fetch full documents now, no .lean()
    const subtasksToDelete: ISubtask[] = await Subtask.find({
      SubtaskId: { $in: subtaskIds },
    });

    // Check if all requested subtasks were found
    if (subtasksToDelete.length !== subtaskIds.length) {
      const foundIds = new Set(subtasksToDelete.map((st) => st.SubtaskId));
      const missingIds = subtaskIds.filter((id) => !foundIds.has(id));
      return NextResponse.json(
        {
          success: false,
          message: `Not Found: Could not find subtask(s) with IDs: ${missingIds.join(", ")}`,
        },
        { status: 404 }
      );
    }

    // Get unique parent task IDs
    const parentTaskIds = Array.from(
      // <--- FIX HERE
      new Set(subtasksToDelete.map((st) => st.parentTaskId))
    );

    // Find the assignment logs containing these parent tasks
    const logs: IAssignedProjectLog[] = await AssignedProjectLog.find({
      tasksIds: { $in: parentTaskIds },
    });

    // Get the unique team IDs associated with these logs
    const uniqueTeamIds = Array.from(new Set(logs.map((log) => log.teamId)));

    if (uniqueTeamIds.length === 0 && parentTaskIds.length > 0) {
      console.error(
        `Data inconsistency: Found parent tasks (${parentTaskIds.join(", ")}) but no corresponding assignment logs.`
      );
      return NextResponse.json(
        { success: false, message: "Internal Error: Assignment logs missing." },
        { status: 500 }
      );
    }

    // Verify the user leads ALL the teams associated with these subtasks
    if (uniqueTeamIds.length > 0) {
      const leaderTeamsCount = await Team.countDocuments({
        teamId: { $in: uniqueTeamIds },
        teamLeader: userId,
      });

      if (leaderTeamsCount !== uniqueTeamIds.length) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Forbidden: You are not the leader for all teams associated with the selected subtasks.",
          },
          { status: 403 }
        );
      }
    }
    // If uniqueTeamIds is empty (e.g., parent tasks not in logs yet?), proceed with deletion if needed,
    // or add specific handling if that state is invalid.

    // 5. Database Operation: Delete Subtasks
    const deleteResult = await Subtask.deleteMany({
      SubtaskId: { $in: subtaskIds },
    });

    // 6. Success Response
    if (deleteResult.deletedCount < subtaskIds.length) {
      console.warn(
        `Deletion discrepancy: Requested ${subtaskIds.length}, deleted ${deleteResult.deletedCount}. Some tasks might have been deleted between check and operation.`
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully deleted ${deleteResult.deletedCount} subtask(s).`,
        deletedCount: deleteResult.deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting subtasks batch:", error);
    let message = "Failed to delete subtasks.";
    if (error instanceof Error) {
      message = error.message;
      console.error(`Specific error: ${message}`);
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
