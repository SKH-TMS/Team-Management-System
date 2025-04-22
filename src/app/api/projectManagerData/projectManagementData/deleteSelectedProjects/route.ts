import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import { getToken, GetUserId, GetUserType } from "@/utils/token";

export async function POST(req: NextRequest) {
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

    const { projectIds } = await req.json();

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "No project IDs provided." },
        { status: 400 }
      );
    }

    const projects = await Project.find({ ProjectId: { $in: projectIds } });
    const projectsToDelete = projects.filter(
      (project) => project.createdBy.toString() === userId
    );

    if (projectsToDelete.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to delete these projects.",
        },
        { status: 403 }
      );
    }

    const result = await Project.deleteMany({
      ProjectId: { $in: projectsToDelete.map((project) => project.ProjectId) },
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "No projects found to delete." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Projects deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting projects:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete projects." },
      { status: 500 }
    );
  }
}
