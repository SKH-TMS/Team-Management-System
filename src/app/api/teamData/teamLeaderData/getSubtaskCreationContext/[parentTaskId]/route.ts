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

type MemberInfo = Pick<IUser, "UserId" | "firstname" | "lastname" | "email">;
type ParentTaskInfo = Pick<ITask, "TaskId" | "title">; // Only need title

export async function GET(
  req: NextRequest,
  { params }: { params: { parentTaskId: string } }
) {
  try {
    const { parentTaskId } = params;
    if (!parentTaskId) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Parent Task ID missing." },
        { status: 400 }
      );
    }

    // Authentication & Authorization
    const token = await getToken(req);
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    const userId = await GetUserId(token);
    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );

    await connectToDatabase();

    // Find Parent Task (just title needed)
    const parentTask = await Task.findOne({ TaskId: parentTaskId }).select(
      "TaskId title"
    );
    if (!parentTask)
      return NextResponse.json(
        { success: false, message: "Parent task not found." },
        { status: 404 }
      );

    // Find Assignment Log & Team
    const log: IAssignedProjectLog | null = await AssignedProjectLog.findOne({
      tasksIds: parentTaskId,
    });
    if (!log)
      return NextResponse.json(
        {
          success: false,
          message: "Assignment log not found for parent task.",
        },
        { status: 404 }
      );

    const team: ITeam | null = await Team.findOne({ teamId: log.teamId });
    if (!team)
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );

    // Verify Leadership
    if (!team.teamLeader || !team.teamLeader.includes(userId)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Not team leader." },
        { status: 403 }
      );
    }

    // Fetch Team Members
    const memberIds = team.members || [];
    let teamMembers: MemberInfo[] = [];
    if (memberIds.length > 0) {
      const memberDocs: IUser[] = await User.find({
        UserId: { $in: memberIds },
      }).select("UserId firstname lastname email");
      teamMembers = memberDocs.map((doc) => doc.toObject());
    }

    // Success Response
    return NextResponse.json({
      success: true,
      parentTask: parentTask,
      teamMembers: teamMembers,
    });
  } catch (error) {
    console.error("Error fetching subtask creation context:", error);
    return NextResponse.json(
      { success: false, message: "Server error." },
      { status: 500 }
    );
  }
}
