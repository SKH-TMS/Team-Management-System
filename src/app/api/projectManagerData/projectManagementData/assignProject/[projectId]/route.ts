import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import { getToken, GetUserType } from "@/utils/token";
import Team from "@/models/Team";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { assignedProjectLogSchema } from "@/schemas/assignedProjectLogSchema";
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

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

    await connectToDatabase();

    const { teamId, deadline } = await req.json();

    if (!projectId || !teamId || !deadline) {
      return NextResponse.json(
        {
          success: false,
          message: "Project ID, Team ID, and Deadline are required.",
        },
        { status: 400 }
      );
    }

    const project = await Project.findOne({ ProjectId: projectId });
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found." },
        { status: 404 }
      );
    }

    const parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid deadline format." },
        { status: 400 }
      );
    }

    const assignmentData = {
      projectId,
      teamId,
      assignedBy: project.createdBy,
      deadline,
    };

    const parsedAssignment = assignedProjectLogSchema.safeParse(assignmentData);
    if (!parsedAssignment.success) {
      const errorMessages = parsedAssignment.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: errorMessages },
        { status: 400 }
      );
    }

    const existingAssignment = await AssignedProjectLog.findOne({ projectId });
    if (existingAssignment) {
      return NextResponse.json(
        { success: false, message: "Project is already assigned to a team." },
        { status: 400 }
      );
    }

    const team = await Team.findOne({ teamId: teamId });
    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );
    }

    const assignedLog = new AssignedProjectLog({
      projectId,
      teamId,
      assignedBy: project.createdBy,
      deadline: parsedDeadline,
    });

    await assignedLog.save();
    return NextResponse.json(
      { success: true, message: "Project assigned successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error assigning project:-", error);
    return NextResponse.json(
      { success: false, message: "Failed to assign project.--" },
      { status: 500 }
    );
  }
}
