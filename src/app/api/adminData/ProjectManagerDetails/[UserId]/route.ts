import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Team from "@/models/Team";
import Project from "@/models/Project";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { getToken, GetUserType } from "@/utils/token";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: { UserId: string } }
) {
  try {
    const targetUserId = params.UserId;

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
    if (!targetUserId)
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: User ID parameter is missing.",
        },
        { status: 400 }
      );

    await connectToDatabase();
    const pmDetails = await User.findOne(
      { UserId: targetUserId, userType: "ProjectManager" },
      { password: 0 }
    ).lean();

    if (!pmDetails) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Project Manager not found or user is not a Project Manager.",
        },
        { status: 404 }
      );
    }

    const createdTeams = await Team.find({ createdBy: targetUserId })
      .select("teamId teamName members teamLeader")
      .lean();

    const allCreatedProjects = await Project.find({ createdBy: targetUserId })
      .select("ProjectId title description status createdAt")
      .lean();
    const assignedProjectIdsResult =
      await AssignedProjectLog.distinct("projectId");
    const assignedProjectIds = new Set(assignedProjectIdsResult.map(String));

    const unassignedProjects = allCreatedProjects.filter(
      (project) => !assignedProjectIds.has(project.ProjectId)
    );

    return NextResponse.json({
      success: true,
      pmDetails: pmDetails,
      createdTeams: createdTeams,
      unassignedProjects: unassignedProjects,
    });
  } catch (error) {
    console.error(
      `❌ Error fetching project manager details for ${params?.UserId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, message: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
