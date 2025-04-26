// src/app/api/teamData/teamLeaderData/createSubTask/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task";
import Subtask, { ISubtask } from "@/models/Subtask"; // Ensure ISubtask has assignedTo: string[]
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs";
import Team, { ITeam } from "@/models/Team";
import User from "@/models/User"; // Needed for finding members if adding to title
import { getToken, GetUserId } from "@/utils/token";

// Zod schema for input validation
const CreateSubtaskSchema = z.object({
  parentTaskId: z.string().min(1, { message: "Parent Task ID is required." }),
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters." }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters." }),
  assignedTo: z
    .string()
    .min(1, {
      message: "Assignee selection ('__all__' or UserID) is required.",
    }), // Still expect string from form
  deadline: z
    .string()
    .datetime({ message: "Invalid deadline format (ISO string expected)." }),
});

export async function POST(req: NextRequest) {
  const createdSubtaskIds: string[] = []; // Track created IDs for potential rollback
  let parentTaskToUpdate: ITask | null = null;

  try {
    // 1. Authentication & Authorization
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
        { success: false, message: "Bad Request: Invalid JSON format." },
        { status: 400 }
      );
    }

    const validationResult = CreateSubtaskSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      return NextResponse.json(
        { success: false, message: `Validation Error: ${errorMessages}` },
        { status: 400 }
      );
    }

    // --- FIX: Access data safely after validation success ---
    const {
      parentTaskId,
      title,
      description,
      assignedTo: assignedToValue,
      deadline,
    } = validationResult.data;
    // --- End Fix ---

    // 3. Database Connection
    await connectToDatabase();

    // 4. Find Parent Task, Log, Team, Verify Leadership
    parentTaskToUpdate = await Task.findOne({ TaskId: parentTaskId });
    if (!parentTaskToUpdate)
      return NextResponse.json(
        { success: false, message: "Parent task not found." },
        { status: 404 }
      );

    const log: IAssignedProjectLog | null = await AssignedProjectLog.findOne({
      tasksIds: parentTaskId,
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

    if (!team.teamLeader || !team.teamLeader.includes(userId)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Not team leader." },
        { status: 403 }
      );
    }

    // 5. Prepare Data
    const deadlineDate = new Date(deadline);
    const teamMemberIds = team.members?.filter((id) => id !== userId) || [];

    // 6. Handle Assignment Logic
    let assigneesForDb: string[] = [];
    let message = ""; // Initialize message variable

    if (assignedToValue === "__all__") {
      // --- Assign to All Members ---
      if (teamMemberIds.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No other members found in the team to assign tasks to.",
          },
          { status: 400 }
        );
      }
      assigneesForDb = teamMemberIds;
      message = `Subtask created and assigned to ${assigneesForDb.length} members!`;
    } else {
      // --- Assign to Single Member ---
      const singleAssigneeId = assignedToValue;
      if (!team.members || !team.members.includes(singleAssigneeId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Bad Request: Assigned user is not part of this team.",
          },
          { status: 400 }
        );
      }
      assigneesForDb = [singleAssigneeId];
      message = "Subtask created successfully!";
    }

    // 7. Create ONE New Subtask
    const newSubtask = new Subtask({
      parentTaskId,
      title,
      description,
      assignedTo: assigneesForDb, // Assign the array
      deadline: deadlineDate,
      status: "Pending",
    });

    const savedSubtask = await newSubtask.save();
    if (!savedSubtask || !savedSubtask.SubtaskId) {
      throw new Error("Subtask creation failed unexpectedly after save.");
    }
    const createdSubtaskId = savedSubtask.SubtaskId; // Assign ID for rollback tracking

    // 8. Update Parent Task's subTasks array
    parentTaskToUpdate.subTasks = parentTaskToUpdate.subTasks || [];
    parentTaskToUpdate.subTasks.push(savedSubtask.SubtaskId);
    await parentTaskToUpdate.save();

    // 9. Success Response
    return NextResponse.json({
      success: true,
      message: message, // Use the determined message
      subtask: savedSubtask.toObject(),
    });
  } catch (error) {
    console.error("Error creating subtask:", error);
    // Rollback Logic: Attempt to delete the subtask if created
    // Use createdSubtaskId which is now correctly scoped
    if (createdSubtaskIds) {
      // Check if an ID was actually assigned before trying rollback
      try {
        await Subtask.deleteOne({ SubtaskId: createdSubtaskIds });
        console.log(`Rolled back subtask ${createdSubtaskIds} due to error.`);
        if (parentTaskToUpdate && parentTaskToUpdate.TaskId) {
          await Task.updateOne(
            { TaskId: parentTaskToUpdate.TaskId },
            { $pull: { subTasks: createdSubtaskIds } }
          );
          console.log(
            `Attempted to rollback subtask ID from parent task ${parentTaskToUpdate.TaskId}.`
          );
        }
      } catch (rollbackError) {
        console.error(
          "CRITICAL: Error during subtask rollback:",
          rollbackError
        );
      }
    }
    // Error Response
    let responseMessage =
      "Failed to create subtask(s). An internal error occurred.";
    let statusCode = 500;
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
      if ((error as any).code === 11000) {
        responseMessage =
          "Failed to create subtask due to a duplicate ID conflict. Please try again.";
        statusCode = 409;
      }
    }
    return NextResponse.json(
      { success: false, message: responseMessage },
      { status: statusCode }
    );
  }
}
