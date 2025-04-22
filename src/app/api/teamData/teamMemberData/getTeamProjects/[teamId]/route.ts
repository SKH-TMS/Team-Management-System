import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Project from "@/models/Project";
import Team from "@/models/Team";
import { getToken, GetUserRole } from "@/utils/token";
export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params;
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unautherized access.",
        },
        { status: 404 }
      );
    }

    const userrole = GetUserRole(token);
    let isverified = false;
    if (userrole && userrole.includes("TeamMember")) {
      isverified = true;
    }
    if (!isverified) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a TeamMember.",
        },
        { status: 404 }
      );
    }
    await connectToDatabase();
    const team = await Team.findOne({ teamId });
    const teamname = team.teamName;
    const logs = await AssignedProjectLog.find({ teamId });

    if (!logs || logs.length === 0) {
      return NextResponse.json({ success: true, projects: [] });
    }

    const projectIds = logs.map((log) => log.projectId);

    const projects = await Project.find({ ProjectId: { $in: projectIds } });

    const projectsWithLog = projects.map((project) => {
      const log = logs.find((l) => l.projectId === project.ProjectId);
      return {
        ...project.toObject(),
        deadline: log?.deadline,
        tasksIds: log?.tasksIds || [],
      };
    });

    return NextResponse.json({
      success: true,
      projects: projectsWithLog,
      teamname,
    });
  } catch (error) {
    console.error("Error fetching team projects:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch team projects." },
      { status: 500 }
    );
  }
}
