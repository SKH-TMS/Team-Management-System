import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";
import Project from "@/models/Project";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { getToken, GetUserType } from "@/utils/token";

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const targetTeamId = params.teamId;

    // 1. Admin Authorization (remains the same)
    const token = await getToken(req);
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    const requesterUserType = await GetUserType(token);
    if (requesterUserType !== "Admin")
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    if (!targetTeamId)
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: Team ID parameter is missing.",
        },
        { status: 400 }
      );

    await connectToDatabase();

    const team = await Team.findOne({ teamId: targetTeamId })
      .populate({
        path: "members",
        model: User,

        foreignField: "UserId",
        select: "UserId firstname lastname email profilepic",
      })
      .populate({
        path: "teamLeader",
        model: User,

        foreignField: "UserId",
        select: "UserId firstname lastname email profilepic",
      })
      .lean();

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );
    }

    const assignedProjects = await AssignedProjectLog.find({
      teamId: targetTeamId,
    })
      .populate({
        path: "projectId",
        model: Project,
        foreignField: "ProjectId",
        select: "ProjectId title description status createdAt",
      })
      .lean();

    return NextResponse.json({
      success: true,
      teamDetails: team,
      assignedProjects: assignedProjects,
    });
  } catch (error) {
    console.error(
      `❌ Error fetching team details for ${params?.teamId}:`,
      error
    );
    let errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    if (error instanceof Error && error.name === "CastError") {
      errorMessage = `Data relationship error: ${error.message}`;
    }
    return NextResponse.json(
      { success: false, message: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
