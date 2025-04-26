// src/app/api/teamData/teamLeaderData/getSubtaskCreationContext/[parentTaskId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task";
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
type ParentTaskInfo = Pick<ITask, "TaskId" | "title">;

export async function GET(
  req: NextRequest,
  { params }: { params: { parentTaskId: string } }
) {
  try {
    // 1. Extract Parent Task ID
    const { parentTaskId } = params;
    if (!parentTaskId) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Parent Task ID is missing." },
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

    // 4. Find Parent Task (only need title and ID)
    const parentTask = await Task.findOne({
      TaskId: parentTaskId,
    }).select("TaskId title"); // Select only necessary fields

    if (!parentTask) {
      return NextResponse.json(
        { success: false, message: "Parent task not found." },
        { status: 404 }
      );
    }

    // 5. Find Assignment Log to get Team ID
    const log: IAssignedProjectLog | null = await AssignedProjectLog.findOne({
      tasksIds: parentTaskId, // Find the log containing this task
    });

    if (!log) {
      console.error(
        `Data inconsistency: Parent Task ${parentTaskId} found but no corresponding assignment log.`
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "Internal Error: Could not find project assignment for this task.",
        },
        { status: 500 }
      );
    }

    // 6. Find the Team
    const team: ITeam | null = await Team.findOne({ teamId: log.teamId });
    if (!team) {
      console.error(
        `Data inconsistency: Assignment log ${log.AssignProjectId} found but no corresponding team ${log.teamId}.`
      );
      return NextResponse.json(
        {
          success: false,
          message: "Internal Error: Could not find team details.",
        },
        { status: 500 }
      );
    }

    // 7. Authorization Check: Verify the user leads this team
    if (!team.teamLeader || !team.teamLeader.includes(userId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You are not the leader of the team assigned to this task.",
        },
        { status: 403 }
      );
    }

    // 8. Fetch Team Member Details (excluding the leader potentially)
    const memberIds = team.members?.filter((id) => id !== userId) || []; // Exclude leader if desired
    let teamMembers: MemberInfo[] = [];
    if (memberIds.length > 0) {
      const memberDocs: IUser[] = await User.find({
        UserId: { $in: memberIds },
      }).select("UserId firstname lastname email profilepic"); // Include profilepic

      teamMembers = memberDocs.map((doc) => doc.toObject());
    }

    // 9. Success Response
    return NextResponse.json({
      success: true,
      parentTask: parentTask, // Return selected parent task details
      teamMembers: teamMembers, // Return list of members for dropdown
    });
  } catch (error) {
    console.error("Error fetching subtask creation context:", error);
    let message = "Failed to fetch data needed for subtask creation.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
      // Avoid exposing internal details in production
      // message = process.env.NODE_ENV === 'development' ? error.message : message;
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
