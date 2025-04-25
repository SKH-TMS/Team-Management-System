// src/app/api/projectManagerData/taskManagementData/getAssignmentContext/[projectId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs";
import Project, { IProject } from "@/models/Project";
import Team, { ITeam } from "@/models/Team";
import { getToken, GetUserType, GetUserId } from "@/utils/token";
// No Zod needed here as we're validating a URL param and have no request body

// Define the structure of the response data
interface AssignmentContext {
  teamId: string;
  teamName: string;
  projectName: string;
}

export async function GET(
  req: NextRequest, // Although unused for GET, it's part of the signature
  { params }: { params: { projectId: string } }
) {
  try {
    // 1. Extract Project ID from Params
    const { projectId } = params;
    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: Project ID is missing in URL.",
        },
        { status: 400 }
      );
    }

    // 2. Authentication & Authorization
    const token = await getToken(req); // Pass req here
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
    const userType = await GetUserType(token);
    if (userType !== "ProjectManager") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: User is not a Project Manager.",
        },
        { status: 403 }
      );
    }
    const projectManagerId = await GetUserId(token);
    if (!projectManagerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID not found in token.",
        },
        { status: 401 }
      );
    }

    // 3. Database Connection
    await connectToDatabase();

    // 4. Find the specific Assigned Project Log created by this PM
    // Crucially, filter by both projectId and assignedBy
    const log: IAssignedProjectLog | null = await AssignedProjectLog.findOne({
      projectId: projectId,
      assignedBy: projectManagerId, // Ensure the logged-in PM created this assignment
    });

    if (!log) {
      // If no log found for this project *and* this PM, deny access
      return NextResponse.json(
        {
          success: false,
          message: `Not Found or Forbidden: No assignment log found for Project ${projectId} managed by you.`,
        },
        { status: 404 } // Or 403, 404 is common for "not found for you"
      );
    }

    // 5. Fetch Associated Project Details
    const project: IProject | null = await Project.findOne({
      ProjectId: log.projectId, // Use projectId from the validated log
    }).select("title"); // Select only the title

    if (!project) {
      // Should be rare if log exists, but handle it
      console.error(
        `Data inconsistency: Log found for non-existent project ${log.projectId}`
      );
      return NextResponse.json(
        {
          success: false,
          message: `Not Found: Project details not found for ID ${log.projectId}.`,
        },
        { status: 404 }
      );
    }

    // 6. Fetch Associated Team Details
    const team: ITeam | null = await Team.findOne({
      teamId: log.teamId, // Use teamId from the validated log
    }).select("teamName"); // Select only the team name

    if (!team) {
      // Should be rare if log exists, but handle it
      console.error(
        `Data inconsistency: Log found for non-existent team ${log.teamId}`
      );
      return NextResponse.json(
        {
          success: false,
          message: `Not Found: Team details not found for ID ${log.teamId}.`,
        },
        { status: 404 }
      );
    }

    // 7. Construct Response Data
    const assignmentContext: AssignmentContext = {
      teamId: log.teamId,
      teamName: team.teamName,
      projectName: project.title,
    };

    // 8. Success Response
    return NextResponse.json({
      success: true,
      assignment: assignmentContext,
    });
  } catch (error) {
    console.error("Error fetching assignment context:", error);
    let message = "Failed to fetch assignment context.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
