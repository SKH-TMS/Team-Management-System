// src/app/api/teamData/teamLeaderData/createSubTask/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task";
import Subtask, { ISubtask } from "@/models/Subtask";
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs";
import Team, { ITeam } from "@/models/Team";
import { getToken, GetUserId } from "@/utils/token";

// Zod schema for input validation
const CreateSubtaskSchema = z.object({
  parentTaskId: z.string().min(1),
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters." }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters." }),
  assignedTo: z.string().min(1, { message: "Assignee is required." }), // UserID
  deadline: z.string().datetime({ message: "Invalid deadline format." }),
});

export async function POST(req: NextRequest) {
  let createdSubtask: ISubtask | null = null; // For potential rollback

  try {
    // Authentication & Authorization
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

    // Parse and Validate Request Body
    const body = await req.json();
    const validationResult = CreateSubtaskSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: `Validation Error: ${errorMessages}` },
        { status: 400 }
      );
    }
    const { parentTaskId, title, description, assignedTo, deadline } =
      validationResult.data;

    await connectToDatabase();

    // Find Parent Task
    const parentTask: ITask | null = await Task.findOne({
      TaskId: parentTaskId,
    });
    if (!parentTask)
      return NextResponse.json(
        { success: false, message: "Parent task not found." },
        { status: 404 }
      );

    // Find Assignment Log & Team
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

    // Create New Subtask
    const newSubtask = new Subtask({
      parentTaskId,
      title,
      description,
      assignedTo,
      deadline: new Date(deadline),
      status: "Pending", // Initial status
      // submittedBy: "Not-submitted" // Default is set in schema
    });

    createdSubtask = await newSubtask.save();
    if (!createdSubtask || !createdSubtask.SubtaskId) {
      throw new Error("Subtask creation failed unexpectedly after save.");
    }

    // Update Parent Task's subTasks array
    parentTask.subTasks = parentTask.subTasks || [];
    parentTask.subTasks.push(createdSubtask.SubtaskId);
    await parentTask.save();

    // Success Response
    return NextResponse.json({
      success: true,
      message: "Subtask created successfully!",
      subtask: createdSubtask.toObject(),
    });
  } catch (error) {
    console.error("Error creating subtask:", error);

    // Rollback: Delete subtask if parent update failed
    if (createdSubtask && createdSubtask.SubtaskId) {
      try {
        await Subtask.deleteOne({ SubtaskId: createdSubtask.SubtaskId });
        console.log(
          `Rolled back subtask ${createdSubtask.SubtaskId} due to error.`
        );
      } catch (rollbackError) {
        console.error(
          "CRITICAL: Error during subtask rollback:",
          rollbackError
        );
      }
    }

    let message = "Failed to create subtask.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
