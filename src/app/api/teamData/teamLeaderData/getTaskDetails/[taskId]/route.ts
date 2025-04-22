import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import { getToken, GetUserId, GetUserRole } from "@/utils/token";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Team from "@/models/Team";
import User from "@/models/User";
export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }

    const userrole = GetUserRole(token);
    let isverified = false;
    if (userrole && userrole.includes("TeamLeader")) {
      isverified = true;
    }
    if (!isverified) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a TeamLeader.",
        },
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
