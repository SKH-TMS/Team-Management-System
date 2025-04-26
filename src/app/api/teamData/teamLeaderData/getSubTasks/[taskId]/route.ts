// src/app/api/teamData/teamLeaderData/getSubTasks/[taskId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task"; // Parent Task
import Subtask, { ISubtask } from "@/models/Subtask"; // Subtask (ensure ISubtask has assignedTo: string[])
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
type ParentTaskInfo = Pick<
  ITask,
  | "TaskId"
  | "title"
  | "description"
  | "deadline"
  | "status"
  | "createdAt"
  | "updatedAt" // Added timestamps
>;

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } } // Renamed param to match folder structure
) {
  try {
    // 1. Extract Parent Task ID
    const parentTaskId = params.taskId;
    if (!parentTaskId) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: Parent Task ID is missing in URL.",
        },
        { status: 400 }
      );
    }

    // 2. Authentication & Authorization (Verify Team Leadership)
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

    // 3. Database Connection
    await connectToDatabase();

    // 4. Find Parent Task (select necessary fields)
    const parentTask = await Task.findOne({
      TaskId: parentTaskId,
    }).select("TaskId title description deadline status createdAt updatedAt"); // Select fields needed for display

    if (!parentTask) {
      return NextResponse.json(
        { success: false, message: "Not Found: Parent task not found." },
        { status: 404 }
      );
    }

    // 5. Find Assignment Log containing this parent task
    const log: IAssignedProjectLog | null = await AssignedProjectLog.findOne({
      tasksIds: parentTaskId,
    }).select("teamId AssignProjectId"); // Select needed fields

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

    // 6. Find the Team associated with the log
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

    // 8. Fetch Subtasks for the Parent Task
    const subtasks: ISubtask[] = await Subtask.find({
      parentTaskId: parentTaskId,
    }).sort({ deadline: 1 }); // Sort by deadline

    // 9. Fetch Team Member Details (including profilepic)
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
      parentTask: parentTask, // Return selected parent task details (already an object due to .select)
      subtasks: subtasks.map((s) => s.toObject()), // Return plain subtask objects
      teamMembers: teamMembers, // Return members for filtering/display
    });
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    let message = "Failed to fetch subtasks.";
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
