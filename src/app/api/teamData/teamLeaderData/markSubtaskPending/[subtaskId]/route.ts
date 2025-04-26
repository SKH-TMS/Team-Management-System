// src/app/api/teamData/teamLeaderData/markSubtaskPending/[subtaskId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import Subtask, { ISubtask } from "@/models/Subtask";
import Task from "@/models/Task";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Team from "@/models/Team";
import { getToken, GetUserId } from "@/utils/token";

// Zod schema for feedback
const FeedbackSchema = z.object({
  feedback: z.string().trim().min(1, { message: "Feedback is required." }),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
    // 1. Extract Subtask ID
    const { subtaskId } = params;
    if (!subtaskId)
      return NextResponse.json(
        { success: false, message: "Bad Request: Subtask ID missing." },
        { status: 400 }
      );

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

    // 3. Parse and Validate Request Body
    const body = await req.json();
    const validationResult = FeedbackSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: `Validation Error: ${errorMessages}` },
        { status: 400 }
      );
    }
    const { feedback } = validationResult.data; // Feedback is captured but might not be stored on subtask directly

    await connectToDatabase();

    // 4. Find the Subtask
    const subtask: ISubtask | null = await Subtask.findOne({
      SubtaskId: subtaskId,
    });
    if (!subtask)
      return NextResponse.json(
        { success: false, message: "Subtask not found." },
        { status: 404 }
      );

    // 5. Authorization Check (Verify TL)
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

    // 6. Validate Current Status (Allow marking pending from 'In Progress' or 'Completed')
    if (subtask.status !== "In Progress" && subtask.status !== "Completed") {
      return NextResponse.json(
        {
          success: false,
          message: `Subtask must be 'In Progress' or 'Completed' to be marked pending. Current status: ${subtask.status}`,
        },
        { status: 400 }
      );
    }

    // 7. Update Subtask Status and Clear Submission Fields
    subtask.status = "Pending";
    subtask.gitHubUrl = undefined; // Clear submission URL
    subtask.context = undefined; // Clear submission context
    subtask.submittedBy = undefined; // Clear submitter
    // Note: We are NOT saving the feedback *on the subtask* here.
    // The feedback is primarily for the team member. It could be logged or sent via notification.
    // The frontend currently updates the parent task's context, which might be okay for PM visibility.

    const updatedSubtask = await subtask.save();

    // 8. Success Response
    return NextResponse.json({
      success: true,
      message: "Subtask marked as Pending successfully.",
      subtask: updatedSubtask.toObject(),
    });
  } catch (error) {
    console.error("Error marking subtask pending:", error);
    let message = "Failed to mark subtask pending.";
    if (error instanceof Error)
      console.error(`Specific error: ${error.message}`);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
