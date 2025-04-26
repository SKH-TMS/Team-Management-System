// src/app/api/teamData/teamLeaderData/updateSubTask/[subtaskId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import Subtask, { ISubtask } from "@/models/Subtask";
import Task from "@/models/Task"; // Needed for auth check
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs"; // Needed for auth check
import Team, { ITeam } from "@/models/Team"; // Needed for auth check
import { getToken, GetUserId } from "@/utils/token";

// Zod schema for update payload validation
const UpdateSubtaskPayloadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters." }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters." }),
  assignedTo: z
    .array(z.string().min(1)) // Expect array of UserIDs
    .min(1, { message: "At least one assignee is required." }),
  deadline: z
    .string()
    .datetime({ message: "Invalid deadline format (ISO string expected)." }),
});

export async function PUT( // Using PUT for update
  req: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
    // 1. Extract Subtask ID
    const { subtaskId } = params;
    if (!subtaskId) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: Subtask ID is missing in URL.",
        },
        { status: 400 }
      );
    }

    // 2. Authentication & Authorization
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
    const userId = await GetUserId(token); // Team Leader's ID
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID not found in token.",
        },
        { status: 401 }
      );
    }

    // 3. Parse and Validate Request Body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { success: false, message: "Bad Request: Invalid JSON format." },
        { status: 400 }
      );
    }

    const validationResult = UpdateSubtaskPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      return NextResponse.json(
        { success: false, message: `Validation Error: ${errorMessages}` },
        { status: 400 }
      );
    }
    // Destructure validated data
    const {
      title,
      description,
      assignedTo: newAssigneeIds,
      deadline,
    } = validationResult.data;

    // 4. Database Connection
    await connectToDatabase();

    // 5. Find the Subtask to Update
    const subtask: ISubtask | null = await Subtask.findOne({
      SubtaskId: subtaskId,
    });
    if (!subtask) {
      return NextResponse.json(
        { success: false, message: "Subtask not found." },
        { status: 404 }
      );
    }

    // 6. Authorization Check: Verify user leads the team associated with the parent task
    const parentTask = await Task.findOne({
      TaskId: subtask.parentTaskId,
    }).select("TaskId");
    if (!parentTask) {
      console.error(
        `Data Integrity Issue: Subtask ${subtaskId} exists but parent task ${subtask.parentTaskId} not found.`
      );
      return NextResponse.json(
        {
          success: false,
          message: "Parent task associated with this subtask not found.",
        },
        { status: 404 }
      );
    }

    const log = await AssignedProjectLog.findOne({
      tasksIds: parentTask.TaskId,
    }).select("teamId AssignProjectId");
    if (!log) {
      console.error(
        `Data Integrity Issue: Parent Task ${parentTask.TaskId} found but no corresponding assignment log.`
      );
      return NextResponse.json(
        {
          success: false,
          message: "Assignment log for the parent task not found.",
        },
        { status: 500 }
      );
    }

    const team: ITeam | null = await Team.findOne({ teamId: log.teamId });
    if (!team) {
      console.error(
        `Data Integrity Issue: Assignment log ${log.AssignProjectId} found but no corresponding team ${log.teamId}.`
      );
      return NextResponse.json(
        {
          success: false,
          message: "Team associated with this subtask not found.",
        },
        { status: 500 }
      );
    }

    if (!team.teamLeader || !team.teamLeader.includes(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not the leader for this subtask's team.",
        },
        { status: 403 }
      );
    }

    // 7. Verify ALL new Assignees are valid members of the team
    const teamMemberIds = team.members || [];
    const invalidAssignees = newAssigneeIds.filter(
      (id) => !teamMemberIds.includes(id)
    );
    if (invalidAssignees.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Bad Request: The following assigned user IDs are not part of this team: ${invalidAssignees.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // 8. Update Subtask Fields using findOneAndUpdate
    // Note: Status is not typically reset here unless required by workflow.
    const updatedSubtask = await Subtask.findOneAndUpdate(
      { SubtaskId: subtaskId }, // Find condition
      {
        $set: {
          // Fields to update
          title,
          description,
          assignedTo: newAssigneeIds, // Set the array of assignees
          deadline: new Date(deadline),
        },
      },
      { new: true, runValidators: true } // Options: return the updated document and run schema validators
    );

    if (!updatedSubtask) {
      // This could happen if the subtask was deleted between the findOne and findOneAndUpdate calls
      console.error(
        `Failed to find and update subtask ${subtaskId} after initial find.`
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "Subtask could not be updated. It might have been deleted or an error occurred.",
        },
        { status: 404 } // Or 500
      );
    }

    // 9. Success Response
    return NextResponse.json({
      success: true,
      message: "Subtask updated successfully!",
      subtask: updatedSubtask.toObject(), // Return plain object
    });
  } catch (error) {
    console.error("Error updating subtask:", error);
    let message =
      "Failed to update subtask. An internal server error occurred.";
    let statusCode = 500;

    // Handle potential Mongoose validation errors if runValidators is true
    if (error instanceof Error && error.name === "ValidationError") {
      message = `Validation failed during update: ${error.message}`;
      statusCode = 400;
    } else if (error instanceof Error) {
      // Log specific error for debugging
      console.error(`Specific error: ${error.message}`);
      // Avoid exposing internal details in production message
      // message = process.env.NODE_ENV === 'development' ? error.message : message;
    }

    return NextResponse.json(
      { success: false, message: message },
      { status: statusCode }
    );
  }
}
