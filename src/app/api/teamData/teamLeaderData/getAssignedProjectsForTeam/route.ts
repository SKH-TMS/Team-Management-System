// src/app/api/teamData/teamLeaderData/getAssignedProjectsForTeam/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs";
import Project, { IProject } from "@/models/Project";
import Team from "@/models/Team"; // Needed for auth check
import { getToken, GetUserId } from "@/utils/token";

// Zod schema for request body validation
const RequestBodySchema = z.object({
  teamId: z.string().trim().min(1, { message: "Team ID is required." }),
});

// Define the specific fields we want to return for each project
type ProjectInfo = Pick<IProject, "ProjectId" | "title">;

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication: Get User ID from token
    const token = await getToken(req);
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    const userId = await GetUserId(token); // Team Leader's ID
    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );

    // 2. Parse and Validate Request Body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Invalid JSON." },
        { status: 400 }
      );
    }

    const validationResult = RequestBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map((e) => e.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: `Validation Error: ${errors}` },
        { status: 400 }
      );
    }
    const { teamId } = validationResult.data;

    // 3. Database Connection
    await connectToDatabase();

    // 4. Authorization Check: Verify user leads the specified team
    const isLeader = await Team.exists({ teamId: teamId, teamLeader: userId });
    if (!isLeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not the leader of the specified team.",
        },
        { status: 403 }
      );
    }

    // 5. Find assignment logs for this specific team
    const logs: Pick<IAssignedProjectLog, "projectId">[] =
      await AssignedProjectLog.find({ teamId: teamId }).select(
        "projectId -_id"
      );

    if (!logs || logs.length === 0) {
      return NextResponse.json({ success: true, projects: [] }); // No projects assigned
    }

    // 6. Get unique project IDs from the logs
    // --- FIX: Use Array.from() for broader compatibility ---
    const uniqueProjectIdsSet = new Set(logs.map((log) => log.projectId));
    const projectIds = Array.from(uniqueProjectIdsSet);
    // --- End Fix ---

    // 7. Fetch project details (ID and title) for the unique IDs
    const projects: ProjectInfo[] = await Project.find({
      ProjectId: { $in: projectIds },
    }).select("ProjectId title -_id");

    // 8. Success Response
    return NextResponse.json({
      success: true,
      projects: projects,
    });
  } catch (error) {
    console.error("Error fetching assigned projects for team:", error);
    let message = "Failed to fetch assigned projects.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
