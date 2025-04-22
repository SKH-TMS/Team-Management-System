export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Project from "@/models/Project";
import Team from "@/models/Team";
import { getToken, GetUserType, GetUserId } from "@/utils/token";

export async function GET(req: NextRequest) {
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

    const UserId = await GetUserId(token);
    if (!UserId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. User ID not found." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const allProjects = await Project.find({ createdBy: UserId });

    const assignedLogs = await AssignedProjectLog.find({ assignedBy: UserId });

    const assignedProjectIds = assignedLogs.map((log) => log.projectId);

    const assignedProjects = allProjects.filter((project) =>
      assignedProjectIds.includes(project.ProjectId)
    );
    const unassignedProjects = allProjects.filter(
      (project) => !assignedProjectIds.includes(project.ProjectId)
    );

    const assignedProjectsWithLogs = await Promise.all(
      assignedProjects.map(async (project) => {
        const log = assignedLogs.find(
          (log) => log.projectId === project.ProjectId
        );
        let teamName = "";
        if (log && log.teamId) {
          const team = await Team.findOne({ teamId: log.teamId });
          teamName = team ? team.teamName : "";
        }
        return {
          ...project.toObject(),
          deadline: log?.deadline,
          tasksIds: log?.tasksIds || [],
          teamIds: log?.teamId,
          teamName,
        };
      })
    );

    return NextResponse.json({
      success: true,
      assignedProjects: assignedProjectsWithLogs,
      unassignedProjects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch projects." },
      { status: 500 }
    );
  }
}
