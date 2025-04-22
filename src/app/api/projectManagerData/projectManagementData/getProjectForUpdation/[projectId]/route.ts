import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import { getToken, GetUserId, GetUserType } from "@/utils/token";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
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
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. User ID not found." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { projectId } = params;
    const project = await Project.findOne({ ProjectId: projectId });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found." },
        { status: 404 }
      );
    }

    if (project.createdBy !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view this project.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      project: {
        ProjectId: project.ProjectId,
        title: project.title,
        description: project.description,
        createdBy: project.createdBy,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        assignedTeam: project.assignedTeam,
      },
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch project." },
      { status: 500 }
    );
  }
}
