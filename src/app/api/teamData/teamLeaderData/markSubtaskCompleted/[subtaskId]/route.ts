// src/app/api/teamData/teamLeaderData/markSubtaskCompleted/[subtaskId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Subtask, { ISubtask } from "@/models/Subtask";
import Task from "@/models/Task"; // Needed to find parent task -> log -> team
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Team from "@/models/Team";
import { getToken, GetUserId } from "@/utils/token";

export async function POST(
  req: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
    // 1. Extract Subtask ID
    const { subtaskId } = params;
    if (!subtaskId) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Subtask ID is missing." },
        { status: 400 }
      );
    }

    // 2. Authentication & Authorization
    const token = await getToken(req);
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    const userId = await GetUserId(token);
    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );

    await connectToDatabase();

    // 3. Find the Subtask
    const subtask: ISubtask | null = await Subtask.findOne({
      SubtaskId: subtaskId,
    });
    if (!subtask)
      return NextResponse.json(
        { success: false, message: "Subtask not found." },
        { status: 404 }
      );

    // 4. Authorization Check: Verify user leads the team associated with the parent task
    const parentTask = await Task.findOne({ TaskId: subtask.parentTaskId });
    if (!parentTask)
      return NextResponse.json(
        { success: false, message: "Parent task not found." },
        { status: 404 }
      );

    const log = await AssignedProjectLog.findOne({
      tasksIds: parentTask.TaskId,
    });
    if (!log)
      return NextResponse.json(
        { success: false, message: "Assignment log not found." },
        { status: 404 }
      );

    const isLeader = await Team.exists({
      teamId: log.teamId,
      teamLeader: userId,
    });
    if (!isLeader)
      return NextResponse.json(
        { success: false, message: "Forbidden: Not team leader." },
        { status: 403 }
      );

    // 5. Validate Current Status (Optional but recommended: Only mark 'In Progress' as 'Completed')
    if (subtask.status !== "In Progress") {
      return NextResponse.json(
        {
          success: false,
          message: `Subtask must be 'In Progress' to be marked completed. Current status: ${subtask.status}`,
        },
        { status: 400 }
      );
    }

    // 6. Update Subtask Status
    subtask.status = "Completed";
    // Optionally clear feedback/context if needed upon completion? Depends on workflow.
    // subtask.context = undefined;
    const updatedSubtask = await subtask.save();

    // 7. Success Response
    return NextResponse.json({
      success: true,
      message: "Subtask marked as Completed successfully.",
      subtask: updatedSubtask.toObject(),
    });
  } catch (error) {
    console.error("Error marking subtask completed:", error);
    let message = "Failed to mark subtask completed.";
    if (error instanceof Error)
      console.error(`Specific error: ${error.message}`);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
