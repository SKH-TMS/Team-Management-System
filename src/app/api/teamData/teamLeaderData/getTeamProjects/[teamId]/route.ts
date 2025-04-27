// src/app/api/teamData/teamLeaderData/getTeamProjects/[teamId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Project, { IProject } from "@/models/Project";
import Team from "@/models/Team";
import User, { IUser } from "@/models/User";
import { getToken, GetUserRole, GetUserId } from "@/utils/token";

// Define the expected shape of a populated member document for clarity
type PopulatedMember = Pick<
  IUser,
  "UserId" | "firstname" | "lastname" | "email" | "profilepic"
>;
// Define the expected shape of the populated team document
interface PopulatedTeam {
  teamId: string;
  teamName: string;
  teamLeader: string; // Or ObjectId if not populated
  members: PopulatedMember[]; // Array of populated members
  // Include other Team fields if necessary
}

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

    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: User ID not found." },
        { status: 401 }
      );
    }

    const { teamId } = params;
    if (!teamId) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Team ID missing." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the team, verify leadership, and populate members
    const team = await Team.findOne({
      teamId: teamId,
      teamLeader: userId,
    }).populate<PopulatedTeam>({
      path: "members", // Field in Team schema containing User IDs (like "User-00002")
      model: User, // The model to populate from
      select: "UserId firstname lastname email profilepic -_id", // Fields to select from User model
      foreignField: "UserId", // <-- FIX: Tell Mongoose to match Team.members values against User.UserId field
    });

    if (!team) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Team not found or you are not the leader.",
        },
        { status: 403 }
      );
    }

    // Find assigned project logs
    const logs = await AssignedProjectLog.find({ teamId: teamId });

    let projectsWithLog = [];
    if (logs && logs.length > 0) {
      const projectIds = logs.map((log) => log.projectId);
      const projects = await Project.find({ ProjectId: { $in: projectIds } });

      projectsWithLog = projects.map((project) => {
        const log = logs.find((l) => l.projectId === project.ProjectId);
        return {
          ...project.toObject(),
          deadline: log?.deadline,
          tasksIds: log?.tasksIds || [],
          ProjectId: project.ProjectId,
          title: project.title,
          description: project.description,
          createdBy: project.createdBy,
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
      });
    }

    // Extract members data safely with explicit type for 'member'
    const membersData = team.members
      ? team.members.map((member: PopulatedMember) => ({
          UserId: member.UserId,
          firstname: member.firstname,
          lastname: member.lastname,
          email: member.email,
          profilepic: member.profilepic,
        }))
      : [];

    return NextResponse.json({
      success: true,
      projects: projectsWithLog,
      teamName: team.teamName,
      members: membersData,
    });
  } catch (error) {
    console.error("Error fetching team projects:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch team projects.";
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
