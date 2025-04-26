// src/app/api/teamData/teamLeaderData/getTasksForAssignment/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs";
import Task, { ITask } from "@/models/Task";
import Team from "@/models/Team"; // Needed for auth check
import { getToken, GetUserId } from "@/utils/token";

// Zod schema for request body validation
const RequestBodySchema = z.object({
  teamId: z.string().trim().min(1, { message: "Team ID is required." }),
  projectId: z.string().trim().min(1, { message: "Project ID is required." }),
});

// Define the specific fields we want to return for each task
type ParentTaskInfo = Pick<ITask, "TaskId" | "title">;

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
    const { teamId, projectId } = validationResult.data;

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

    // 5. Find the specific assignment log for this project and team
    const log: IAssignedProjectLog | null = await AssignedProjectLog.findOne({
      projectId: projectId,
      teamId: teamId,
    });

    // Check if the log exists and if the user is authorized (redundant check, but safe)
    if (!log) {
      // If the PM assigned it but the TL is fetching, this log should exist if the project was assigned.
      // If it doesn't exist, it means the project isn't assigned to this team.
      return NextResponse.json(
        {
          success: false,
          message: `Not Found: No assignment log found for Project ${projectId} and Team ${teamId}.`,
        },
        { status: 404 }
      );
    }

    // 6. Check if there are any tasks in the log
    if (!log.tasksIds || log.tasksIds.length === 0) {
      // No tasks assigned to this project/team assignment yet
      return NextResponse.json({ success: true, tasks: [] });
    }

    // 7. Fetch task details (only ID and title needed for the dropdown)
    const tasks: ParentTaskInfo[] = await Task.find(
      { TaskId: { $in: log.tasksIds } } // Find tasks whose IDs are in the log's array
    ).select("TaskId title -_id"); // Select only needed fields

    // 8. Success Response
    return NextResponse.json({
      success: true,
      tasks: tasks, // Return the array of task info objects
    });
  } catch (error) {
    console.error("Error fetching tasks for assignment:", error);
    let message = "Failed to fetch tasks for assignment.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
