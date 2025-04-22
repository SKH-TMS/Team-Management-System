import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Project from "@/models/Project";
import Team from "@/models/Team";
import { getToken, GetUserType } from "@/utils/token";
export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }
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

    const { teamId } = params;

    await connectToDatabase();
    const logs = await AssignedProjectLog.find({ teamId });

    if (!logs || logs.length === 0) {
      return NextResponse.json({ success: true, projects: [] });
    }
    const team = await Team.findOne({ teamId });
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
      teamName: team.teamName,
    });
  } catch (error) {
    console.error("Error fetching team projects:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch team projects again." },
      { status: 500 }
    );
  }
}
