// src/app/api/teamData/teamMemberData/getSubtasks/[taskId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task";
import Subtask, { ISubtask } from "@/models/Subtask";
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs";
import Team, { ITeam } from "@/models/Team";
import { getToken, GetUserId } from "@/utils/token";

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const parentTaskId = params.taskId;
    if (!parentTaskId) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: TaskId is missing in URL.",
        },
        { status: 400 }
      );
    }

    // Authentication
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
        {
          success: false,
          message: "Unauthorized: Invalid token or user not found.",
        },
        { status: 401 }
      );
    }

    // Connect to DB
    await connectToDatabase();
    console.log(parentTaskId);
    // 1. Fetch parent task
    const parentTaskDoc = await Task.findOne({ TaskId: parentTaskId }).select(
      "TaskId title description deadline status createdAt updatedAt"
    );
    if (!parentTaskDoc) {
      return NextResponse.json(
        { success: false, message: "Not Found: Task not found." },
        { status: 404 }
      );
    }

    // 2. Find the assignment log that includes this task
    const log = await AssignedProjectLog.findOne({
      tasksIds: parentTaskId,
    }).select("teamId");
    if (!log) {
      console.error(`Assignment log missing for TaskId=${parentTaskId}`);
      return NextResponse.json(
        {
          success: false,
          message: "Internal Error: Could not find assignment for this task.",
        },
        { status: 500 }
      );
    }

    // 3. Fetch the team
    const team = await Team.findOne({ teamId: log.teamId });
    if (!team) {
      console.error(
        `Team missing for teamId=${log.teamId} in log for TaskId=${parentTaskId}`
      );
      return NextResponse.json(
        {
          success: false,
          message: "Internal Error: Could not find team details.",
        },
        { status: 500 }
      );
    }

    // 4. Authorization: ensure current user is a team member
    if (!team.members.includes(userId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You are not a member of the team assigned to this task.",
        },
        { status: 403 }
      );
    }

    // 5. Fetch subtasks
    const subtaskDocs = await Subtask.find({
      parentTaskId: parentTaskId,
    }).sort({ deadline: 1 });

    // 6. Respond
    return NextResponse.json({
      success: true,
      parentTask: parentTaskDoc.toObject(),
      subtasks: subtaskDocs.map((s) => s.toObject()),
      currentUserId: userId,
    });
  } catch (err: any) {
    console.error("Error in teamMember getSubtasks:", err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Failed to fetch subtasks.",
      },
      { status: 500 }
    );
  }
}
