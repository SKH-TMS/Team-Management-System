import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Project from "@/models/Project";
import { getToken, GetUserRole } from "@/utils/token";
export async function POST(req: NextRequest) {
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
    const { teamId } = await req.json();
    if (!teamId) {
      return NextResponse.json(
        { success: false, message: "No Teamid si defiend" },
        { status: 401 }
      );
    }
    await connectToDatabase();
    const assignedProjects = await AssignedProjectLog.find({ teamId: teamId });

    if (assignedProjects.length === 0) {
      return NextResponse.json(
        { success: false, message: "No projects found for this team." },
        { status: 404 }
      );
    }

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
