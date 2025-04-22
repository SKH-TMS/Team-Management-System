import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import User from "@/models/User";
import Team from "@/models/Team";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { getToken, verifyToken, GetUserType } from "@/utils/token";
import { createProjectSchema } from "@/schemas/projectSchema";
import { assignedProjectLogSchema } from "@/schemas/assignedProjectLogSchema";
export async function POST(req: NextRequest) {
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
          message: "Unauthorized access, you are not a Project Manager",
        },
        { status: 401 }
      );
    }

    const decodedUser = verifyToken(token);
    if (!decodedUser || !decodedUser.email) {
      return NextResponse.json(
        { success: false, message: "Invalid token." },
        { status: 403 }
      );
    }

    const { title, description, deadline, assignedTeam } = await req.json();

    if (!title || !description) {
      return NextResponse.json(
        {
          success: false,
          message: "Title and description are required.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let parsedDeadline = null;
    if (assignedTeam) {
      if (!deadline) {
        return NextResponse.json(
          {
            success: false,
            message: "Deadline is required when assigning a team.",
          },
          { status: 400 }
        );
      }

      parsedDeadline = new Date(deadline);
      if (isNaN(parsedDeadline.getTime())) {
        return NextResponse.json(
          { success: false, message: "Invalid deadline format." },
          { status: 400 }
        );
      }
    }

    const projectManager = await User.findOne({ email: decodedUser.email });
    if (!projectManager) {
      return NextResponse.json(
        { success: false, message: "Project Manager not found." },
        { status: 404 }
      );
    }

    const parsedData = createProjectSchema.safeParse({
      title,
      description,
      createdBy: projectManager.UserId,
    });

    if (!parsedData.success) {
      const errorMessages = parsedData.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: errorMessages },
        { status: 400 }
      );
    }

    if (assignedTeam) {
      const teamData = await Team.findOne({ teamId: assignedTeam.teamId });
      if (!teamData) {
        return NextResponse.json(
          { success: false, message: "Required team not found." },
          { status: 404 }
        );
      }

      const newProject = new Project({
        title,
        description,
        createdBy: projectManager.UserId,
      });

      await newProject.save();

      const parsedAssignment = assignedProjectLogSchema.safeParse({
        projectId: newProject.ProjectId,
        teamId: teamData.teamId,
        assignedBy: projectManager.UserId,

        deadline: parsedDeadline!.toISOString(),
      });

      if (!parsedAssignment.success) {
        const errorMessages = parsedAssignment.error.errors
          .map((err) => err.message)
          .join(", ");

        await Project.deleteOne({ projectId: newProject.ProjectId });
        throw new Error(errorMessages);
      }
      const assignedLog = new AssignedProjectLog({
        projectId: newProject.ProjectId,
        teamId: teamData.teamId,
        assignedBy: projectManager.UserId,
        deadline: parsedDeadline,
      });

      await assignedLog.save();
    } else {
      const newProject = new Project({
        title,
        description,
        createdBy: projectManager.UserId,
      });

      await newProject.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: assignedTeam
          ? "Project created and assigned to team successfully!"
          : "Project created successfully without assigning a team.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating project:", error);
    return NextResponse.json(
      { success: false, message: "Server error while creating project." },
      { status: 500 }
    );
  }
}
