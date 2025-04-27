// src/app/api/teamData/teamMemberData/getTeamProjects/[teamId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Project, { IProject } from "@/models/Project"; // Assuming IProject interface exists
import Team from "@/models/Team";
import User, { IUser } from "@/models/User"; // Assuming IUser interface exists
import { getToken, GetUserRole, GetUserId } from "@/utils/token"; // Added GetUserId

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
    const { teamId } = params;
    if (!teamId) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Team ID missing." },
        { status: 400 }
      );
    }

    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 } // Use 401 for Unauthorized
      );
    }

    // Optional: Verify the user is actually part of this team (Authorization)
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: User ID not found." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Find the team and populate its members
    // We also verify the requesting user is a member of this team
    const team = await Team.findOne({ teamId: teamId, members: userId }) // Check if user is in members array
      .populate<PopulatedTeam>({
        path: "members",
        model: User,
        select: "UserId firstname lastname email profilepic -_id",
        foreignField: "UserId", // Match Team.members values against User.UserId
      });

    if (!team) {
      // If team not found OR user is not a member
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Team not found or you are not a member of this team.",
        },
        { status: 403 } // Use 403 Forbidden
      );
    }

    const teamName = team.teamName; // Get team name from the found team document

    // Find assigned project logs for this team
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
          // Ensure all fields needed by the frontend Project interface are here
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
      teamName: teamName, // Use the fetched team name
      members: membersData, // Return the populated members
    });
  } catch (error) {
    console.error("Error fetching team member projects:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch team projects.";
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
