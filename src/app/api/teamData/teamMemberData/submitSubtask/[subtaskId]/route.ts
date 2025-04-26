// src/app/api/teamData/teamMemberData/submitSubtask/[subtaskId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Subtask from "@/models/Subtask";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Team from "@/models/Team";
import { getToken, GetUserId } from "@/utils/token";

export async function POST(
  req: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
    const { subtaskId } = params;
    if (!subtaskId) {
      return NextResponse.json(
        { success: false, message: "Missing subtaskId in URL." },
        { status: 400 }
      );
    }

    // Authenticate user
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
        { success: false, message: "Unauthorized: Invalid token." },
        { status: 401 }
      );
    }

    // Parse request body
    const { gitHubUrl, context } = await req.json();
    if (!gitHubUrl || typeof gitHubUrl !== "string") {
      return NextResponse.json(
        { success: false, message: "GitHub URL is required." },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // 1. Find the subtask
    const subtask = await Subtask.findOne({ SubtaskId: subtaskId });
    if (!subtask) {
      return NextResponse.json(
        { success: false, message: "Subtask not found." },
        { status: 404 }
      );
    }

    // 2. Verify user is assigned to this subtask
    const assignedIds = Array.isArray(subtask.assignedTo)
      ? subtask.assignedTo
      : [subtask.assignedTo];
    if (!assignedIds.includes(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not assigned to this subtask.",
        },
        { status: 403 }
      );
    }

    // 3. Find the assignment log via the parent TaskId
    const parentTaskId = subtask.parentTaskId;
    const log = await AssignedProjectLog.findOne({
      tasksIds: parentTaskId,
    });
    if (!log) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Internal Error: Could not find project assignment for this task.",
        },
        { status: 500 }
      );
    }

    // 4. Verify user is part of the assigned team
    const team = await Team.findOne({ teamId: log.teamId });
    if (!team || !team.members.includes(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not a member of the assigned team.",
        },
        { status: 403 }
      );
    }

    // 5. Update and save subtask
    subtask.gitHubUrl = gitHubUrl;
    subtask.context = context || "";
    subtask.submittedBy = userId;
    subtask.status = "In Progress";
    await subtask.save();

    return NextResponse.json({
      success: true,
      subtask: subtask.toObject(),
    });
  } catch (error: any) {
    console.error("Error submitting subtask:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Server error while submitting subtask.",
      },
      { status: 500 }
    );
  }
}
