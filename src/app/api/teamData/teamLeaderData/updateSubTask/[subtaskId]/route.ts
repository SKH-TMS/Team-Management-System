// src/app/api/teamData/teamLeaderData/updateSubTask/[subtaskId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import Subtask, { ISubtask } from "@/models/Subtask";
import Task from "@/models/Task";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Team, { ITeam } from "@/models/Team";
import { getToken, GetUserId } from "@/utils/token";

// Zod schema for update payload
const UpdateSubtaskPayloadSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(10),
  assignedTo: z.string().min(1), // UserID
  deadline: z.string().datetime(),
});

export async function PUT( // Using PUT for update
  req: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
    const { subtaskId } = params;
    if (!subtaskId)
      return NextResponse.json(
        { success: false, message: "Bad Request: Subtask ID missing." },
        { status: 400 }
      );

    // Auth
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

    // Validate Body
    const body = await req.json();
    const validationResult = UpdateSubtaskPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map((e) => e.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: `Validation Error: ${errors}` },
        { status: 400 }
      );
    }
    const { title, description, assignedTo, deadline } = validationResult.data;

    await connectToDatabase();

    // Find Subtask
    const subtask: ISubtask | null = await Subtask.findOne({
      SubtaskId: subtaskId,
    });
    if (!subtask)
      return NextResponse.json(
        { success: false, message: "Subtask not found." },
        { status: 404 }
      );

    // Find Parent Task -> Log -> Team for Auth and Member Verification
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
    const team: ITeam | null = await Team.findOne({ teamId: log.teamId });
    if (!team)
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );

    // Verify Leadership
    if (!team.teamLeader || !team.teamLeader.includes(userId)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Not team leader." },
        { status: 403 }
      );
    }

    // Verify Assignee is in the team
    if (!team.members || !team.members.includes(assignedTo)) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: Assigned user is not part of this team.",
        },
        { status: 400 }
      );
    }

    // Update Subtask
    // Note: We generally don't reset status when updating details unless specifically required.
    // If the subtask was 'Completed', updating it might imply it needs review again,
    // but let's keep status unchanged for now unless explicitly requested.
    const updatedSubtask = await Subtask.findOneAndUpdate(
      { SubtaskId: subtaskId },
      {
        $set: {
          title,
          description,
          assignedTo,
          deadline: new Date(deadline),
          // Optionally update status here if needed, e.g., back to 'Pending' or 'In Progress'
          // status: subtask.status === 'Completed' ? 'Pending' : subtask.status // Example logic
        },
      },
      { new: true } // Return the updated document
    );

    if (!updatedSubtask) {
      // Should not happen if findOne worked, but good check
      return NextResponse.json(
        { success: false, message: "Subtask found but update failed." },
        { status: 500 }
      );
    }

    // Success Response
    return NextResponse.json({
      success: true,
      message: "Subtask updated successfully!",
      subtask: updatedSubtask.toObject(),
    });
  } catch (error) {
    console.error("Error updating subtask:", error);
    let message = "Failed to update subtask.";
    if (error instanceof Error)
      console.error(`Specific error: ${error.message}`);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
