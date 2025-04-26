// src/app/api/teamData/teamLeaderData/getSubtaskUpdateContext/[subtaskId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Subtask, { ISubtask } from "@/models/Subtask";
import Task from "@/models/Task";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Team, { ITeam } from "@/models/Team";
import User, { IUser } from "@/models/User";
import { getToken, GetUserId } from "@/utils/token";

type MemberInfo = Pick<
  IUser,
  "UserId" | "firstname" | "lastname" | "email" | "profilepic"
>; // Include profilepic

export async function GET(
  req: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
    const { subtaskId } = params;
    if (!subtaskId)
      return NextResponse.json(
        { success: false, message: "Bad Request: Subtask ID missing." },
        { status: 400 }
      );

    // Auth
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

    // Find Subtask
    const subtask: ISubtask | null = await Subtask.findOne({
      SubtaskId: subtaskId,
    });
    if (!subtask)
      return NextResponse.json(
        { success: false, message: "Subtask not found." },
        { status: 404 }
      );

    // Find Parent Task -> Log -> Team for Auth and Member Fetching
    const parentTask = await Task.findOne({ TaskId: subtask.parentTaskId });
    if (!parentTask)
      return NextResponse.json(
        { success: false, message: "Parent task not found." },
        { status: 404 }
      );
    const log = await AssignedProjectLog.findOne({
      tasksIds: parentTask.TaskId,
    });
    if (!log)
      return NextResponse.json(
        { success: false, message: "Assignment log not found." },
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
      }).select("UserId firstname lastname email profilepic"); // Select needed fields including profilepic
      teamMembers = memberDocs.map((doc) => doc.toObject());
    }

    // Success Response
    return NextResponse.json({
      success: true,
      subtask: subtask.toObject(), // Send full subtask details
      teamMembers: teamMembers,
    });
  } catch (error) {
    console.error("Error fetching subtask update context:", error);
    return NextResponse.json(
      { success: false, message: "Server error." },
      { status: 500 }
    );
  }
}
