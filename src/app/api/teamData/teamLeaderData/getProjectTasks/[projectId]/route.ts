// src/app/api/teamData/teamLeaderData/getProjectTasks/[projectId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs";
import Task, { ITask } from "@/models/Task";
import User, { IUser } from "@/models/User";
import Project, { IProject } from "@/models/Project";
import Team, { ITeam } from "@/models/Team"; // Need Team model to find leader's team
import { getToken, GetUserId } from "@/utils/token"; // Assuming GetUserType isn't strictly needed if we verify leadership

// Define return types for clarity
type SubmitterInfo = Pick<
  IUser,
  "UserId" | "firstname" | "lastname" | "email" | "profilepic"
>;
type CurrentUserInfo = Pick<IUser, "UserId">; // Or include more fields if needed

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // 1. Extract Project ID
    const { projectId } = params;
    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Project ID is missing." },
        { status: 400 }
      );
    }

    // 2. Authentication & Authorization (Verify Team Leadership)
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID not found in token.",
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Find the team(s) this user leads
    const ledTeams: ITeam[] = await Team.find({ teamLeader: userId }); // Use lean for efficiency
    if (!ledTeams || ledTeams.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not a leader of any team.",
        },
        { status: 403 }
      );
    }
    const ledTeamIds = ledTeams.map((team) => team.teamId);

    // 3. Find the Assignment Log for this project AND one of the leader's teams
    const log: IAssignedProjectLog | null = await AssignedProjectLog.findOne({
      projectId: projectId,
      teamId: { $in: ledTeamIds }, // Check if assigned to a team led by the user
    });

    if (!log) {
      // If no log found for this project assigned to one of the leader's teams
      return NextResponse.json(
        {
          success: false,
          message: `Not Found or Forbidden: No assignment found for Project ${projectId} linked to your team(s).`,
        },
        { status: 404 }
      );
    }

    // 4. Fetch Project Title
    const project: IProject | null = await Project.findOne({
      ProjectId: log.projectId,
    }).select("title");

    if (!project) {
      console.error(
        `Data inconsistency: Log found for non-existent project ${log.projectId}`
      );
      return NextResponse.json(
        {
          success: false,
          message: `Not Found: Project details could not be retrieved.`,
        },
        { status: 404 }
      );
    }
    const projectTitle = project.title;

    // 5. Fetch Tasks associated with this log
    const tasksIds = log.tasksIds;
    let tasks: ITask[] = [];
    if (tasksIds && tasksIds.length > 0) {
      tasks = await Task.find({ TaskId: { $in: tasksIds } });
    }

    // 6. Fetch Submitter Details (if needed for completed view)
    const submitterUserIdsSet = new Set<string>();
    tasks.forEach((task) => {
      if (task.submittedby && task.submittedby !== "Not-submitted") {
        submitterUserIdsSet.add(task.submittedby);
      }
    });
    const submittedUserIds = Array.from(submitterUserIdsSet);
    let submitters: SubmitterInfo[] = [];
    if (submittedUserIds.length > 0) {
      const submitterDocs: IUser[] = await User.find({
        UserId: { $in: submittedUserIds },
      }).select("UserId firstname lastname email profilepic");
      submitters = submitterDocs.map((doc) => doc.toObject()); // Convert to plain objects
    }

    // 7. Prepare Current User Info
    const currentUserInfo: CurrentUserInfo = { UserId: userId };

    // 8. Success Response
    return NextResponse.json({
      success: true,
      tasks: tasks.map((t) => t.toObject()), // Return plain objects
      submitters: submitters,
      title: projectTitle,
      currentUser: currentUserInfo,
    });
  } catch (error) {
    console.error("Error fetching team project tasks:", error);
    let message = "Failed to fetch project tasks.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
