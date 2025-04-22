// src/app/api/teamData/getTaskDetails/[taskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import { getToken, GetUserType } from "@/utils/token";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Team from "@/models/Team";
import User from "@/models/User";
export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // Extract token and verify user
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }
    const usertype = await GetUserType(token);
    if (usertype !== "ProjectManager") {
      return NextResponse.json(
        { success: false, message: "You are not a projectManager." },
        { status: 401 }
      );
    }
    const { taskId } = params;
    const { projectId } = await req.json();
    await connectToDatabase();

    const task = await Task.findOne({ TaskId: taskId });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found." },
        { status: 404 }
      );
    }
    const assignedProjectLog = await AssignedProjectLog.findOne({ projectId });
    const team = await Team.findOne({ teamId: assignedProjectLog.teamId });
    const members = await User.find({ UserId: { $in: team.members } });

    return NextResponse.json({
      success: true,
      task,
      members: members.map((member) => ({
        UserId: member.UserId,
        firstname: member.firstname,
        lastname: member.lastname,
        profilepic: member.profilepic,
        email: member.email,
      })),
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch task details." },
      { status: 500 }
    );
  }
}
