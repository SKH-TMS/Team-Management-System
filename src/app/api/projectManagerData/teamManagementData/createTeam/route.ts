import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import Project from "@/models/Project";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { getToken, verifyToken, GetUserType } from "@/utils/token";
import User from "@/models/User";
import { teamSchema } from "@/schemas/teamSchema";
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

    const { teamName, teamLeader, members, assignedProject, deadline } =
      await req.json();

    if (!teamName || !teamLeader || !members || members.length === 0) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const memberUserIds = members
      .filter((member: { email: string }) => member.email !== teamLeader.email)
      .map((member: { userId: string }) => member.userId);

    const decodedUser = verifyToken(token);
    if (!decodedUser || !decodedUser.email) {
      return NextResponse.json(
        { success: false, message: "Invalid token." },
        { status: 403 }
      );
    }

    const projectManager = await User.findOne({ email: decodedUser.email });
    if (!projectManager) {
      return NextResponse.json(
        { success: false, message: "Project Manager not found." },
        { status: 404 }
      );
    }

    let teamLeaderids: string[] = [teamLeader.userId];
    const parsedData = teamSchema.safeParse({
      teamName,
      teamLeader: teamLeaderids,
      members: memberUserIds,
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

    if (assignedProject) {
      const parsedDeadline = new Date(deadline);
      if (isNaN(parsedDeadline.getTime())) {
        return NextResponse.json(
          { success: false, message: "Invalid deadline format." },
          { status: 400 }
        );
      }
      if (parsedDeadline) {
        const project = await Project.findOne({
          ProjectId: assignedProject.ProjectId,
        });

        const projectId = project.ProjectId;

        if (!project && !project.ProjectId) {
          return NextResponse.json(
            { success: false, message: "Project not found" },
            { status: 404 }
          );
        }

        const newTeam = new Team({
          teamName,
          teamLeader: teamLeader.userId,
          members: memberUserIds,
          createdBy: projectManager.UserId,
        });

        await newTeam.save();
        const parsedAssignment = assignedProjectLogSchema.safeParse({
          projectId: projectId,
          teamId: newTeam.teamId,
          assignedBy: projectManager.UserId,
          deadline: deadline,
        });

        if (!parsedAssignment.success) {
          const errorMessages = parsedAssignment.error.errors
            .map((err) => err.message)
            .join(", ");
          await Team.deleteOne({ teamId: newTeam.teamId });
          return NextResponse.json(
            { success: false, message: errorMessages },
            { status: 404 }
          );
        }

        const assignedLog = new AssignedProjectLog({
          projectId: projectId,
          teamId: newTeam.teamId,
          assignedBy: projectManager.UserId,
          deadline: parsedDeadline,
        });

        await assignedLog.save();
      } else
        return NextResponse.json(
          { success: false, message: "Deadline not defiend" },
          { status: 500 }
        );
    } else {
      const newTeam = new Team({
        teamName,
        teamLeader: teamLeader.userId,
        members: memberUserIds,
        createdBy: projectManager.UserId,
      });

      await newTeam.save();
    }

    return NextResponse.json({
      success: true,
      message: assignedProject
        ? "Team created and assigned to the project successfully!"
        : "Team created successfully without project assignment.",
    });
  } catch (error) {
    console.error("❌ Error creating team:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create team" },
      { status: 500 }
    );
  }
}
