// src/app/api/teamData/teamLeaderData/getSubtaskUpdateContext/[subtaskId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Subtask, { ISubtask } from "@/models/Subtask";
import Task, { ITask } from "@/models/Task"; // Needed to find parent task -> log -> team
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs";
import Team, { ITeam } from "@/models/Team";
import User, { IUser } from "@/models/User";
import { getToken, GetUserId } from "@/utils/token";

// Define return types for clarity
type MemberInfo = Pick<
  IUser,
  "UserId" | "firstname" | "lastname" | "email" | "profilepic"
>;

export async function GET(
  req: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
    // 1. Extract Subtask ID
    const { subtaskId } = params;
    if (!subtaskId) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: Subtask ID is missing in URL.",
        },
        { status: 400 }
      );
    }

    // 2. Authentication & Authorization
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
    const userId = await GetUserId(token); // Team Leader's ID
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID not found in token.",
        },
        { status: 401 }
      );
    }

    // 3. Database Connection
    await connectToDatabase();

    // 4. Find the Subtask
    const subtask: ISubtask | null = await Subtask.findOne({
      SubtaskId: subtaskId,
    });
    if (!subtask) {
      return NextResponse.json(
        { success: false, message: "Subtask not found." },
        { status: 404 }
      );
    }

    // 5. Find Parent Task to trace back to the Team
    const parentTask: ITask | null = await Task.findOne({
      TaskId: subtask.parentTaskId,
    }).select("TaskId"); // Only need TaskId
    if (!parentTask) {
      // This indicates a data integrity issue if a subtask exists without a parent
      console.error(
        `Data Integrity Issue: Subtask ${subtaskId} exists but parent task ${subtask.parentTaskId} not found.`
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "Error: Could not find the parent task associated with this subtask.",
        },
        { status: 404 } // Or 500 depending on how you want to handle integrity issues
      );
    }

    // 6. Find Assignment Log using Parent Task ID
    const log: IAssignedProjectLog | null = await AssignedProjectLog.findOne({
      tasksIds: parentTask.TaskId, // Find the log containing the parent task
    }).select("teamId"); // Only need teamId

    if (!log) {
      console.error(
        `Data Integrity Issue: Parent Task ${parentTask.TaskId} found but no corresponding assignment log.`
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "Internal Error: Could not find project assignment for the parent task.",
        },
        { status: 500 }
      );
    }

    // 7. Find the Team using Team ID from the Log
    const team: ITeam | null = await Team.findOne({ teamId: log.teamId });
    if (!team) {
      console.error(
        `Data Integrity Issue: Assignment log ${log.AssignProjectId} found but no corresponding team ${log.teamId}.`
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "Internal Error: Could not find team details associated with this task.",
        },
        { status: 500 }
      );
    }

    // 8. Authorization Check: Verify the current user leads this team
    if (!team.teamLeader || !team.teamLeader.includes(userId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You are not the leader of the team managing this subtask.",
        },
        { status: 403 }
      );
    }

    // 9. Fetch Team Member Details (including profilepic)
    // Fetch all members of the team for the dropdown
    const memberIds = team.members || [];
    let teamMembers: MemberInfo[] = [];
    if (memberIds.length > 0) {
      const memberDocs: IUser[] = await User.find({
        UserId: { $in: memberIds },
      }).select("UserId firstname lastname email profilepic"); // Ensure profilepic is selected

      teamMembers = memberDocs.map((doc) => doc.toObject());
    }

    // 10. Success Response
    return NextResponse.json({
      success: true,
      subtask: subtask.toObject(), // Send full subtask details
      teamMembers: teamMembers, // Send members for the dropdown
    });
  } catch (error) {
    console.error("Error fetching subtask update context:", error);
    let message = "Failed to fetch data for subtask update.";
    // Avoid exposing internal error details to the client in production
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
      // message = process.env.NODE_ENV === 'development' ? error.message : message;
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
