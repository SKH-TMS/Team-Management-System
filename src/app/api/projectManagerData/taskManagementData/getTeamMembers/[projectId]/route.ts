import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";
import { getToken, GetUserType } from "@/utils/token";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Project from "@/models/Project";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
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
    const { projectId } = params;
    const project = await Project.findOne({
      ProjectId: { $in: projectId },
    }).lean();
    // Connect to the database
    await connectToDatabase();
    const assignedProjectLog = await AssignedProjectLog.findOne({ projectId });
    const team = await Team.findOne({ teamId: assignedProjectLog.teamId });
    const members = await User.find({ UserId: { $in: team.members } });

    return NextResponse.json({
      success: true,
      membersData: members.map((member) => ({
        UserId: member.UserId,
        firstname: member.firstname,
        lastname: member.lastname,
        profilepic: member.profilepic,
        email: member.email,
      })),
      project,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch teams." },
      { status: 500 }
    );
  }
}
