import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Project from "@/models/Project";
import { getToken, GetUserType } from "@/utils/token";
export async function POST(req: NextRequest) {
  try {
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }
    // Check if the user is a ProjectManager
    const userType = await GetUserType(token);
    if (!userType || userType !== "ProjectManager") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access. You are not a Project Manager.",
        },
        { status: 401 }
      );
    }
    const { teamId } = await req.json(); // Get the teamId from the URL parameter
    if (!teamId) {
      return NextResponse.json(
        { success: false, message: "No Teamid si defiend" },
        { status: 401 }
      );
    }
    // Connect to the database
    await connectToDatabase();
    // Find the assigned projects for the selected team
    const assignedProjects = await AssignedProjectLog.find({ teamId: teamId });

    if (assignedProjects.length === 0) {
      return NextResponse.json(
        { success: false, message: "No projects found for this team." },
        { status: 404 }
      );
    }

    // Get project details for each projectId in the assigned projects
    const projects = await Promise.all(
      assignedProjects.map(async (assignment) => {
        const project = await Project.findOne({
          ProjectId: assignment.projectId,
        });
        if (!project) return null;

        return {
          ProjectId: project.ProjectId,
          title: project.title,
          description: project.description,
          status: project.status,
        };
      })
    );

    // Filter out any null values (projects not found)
    const filteredProjects = projects.filter((project) => project !== null);

    return NextResponse.json({ success: true, projects: filteredProjects });
  } catch (error) {
    console.log(error);
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch projects." },
      { status: 500 }
    );
  }
}
