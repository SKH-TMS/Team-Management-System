import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import Task from "@/models/Task";
import User from "@/models/User";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { getToken, GetUserType } from "@/utils/token";
import mongoose from "mongoose";

interface PopulatedAssignee {
  _id: mongoose.Types.ObjectId | string;
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
}

interface PopulatedTask
  extends Omit<InstanceType<typeof Task>, "assignedTo" | "submittedby"> {
  _id: mongoose.Types.ObjectId | string;
  assignedTo: PopulatedAssignee[];
  submittedby?: PopulatedAssignee | string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const targetProjectId = params.projectId;

    const token = await getToken(req);
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    const requesterUserType = await GetUserType(token);
    if (requesterUserType !== "Admin")
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    if (!targetProjectId)
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: Project ID parameter is missing.",
        },
        { status: 400 }
      );

    await connectToDatabase();

    const projectDetails = await Project.findOne({
      ProjectId: targetProjectId,
    }).lean();

    if (!projectDetails) {
      return NextResponse.json(
        { success: false, message: "Project not found." },
        { status: 404 }
      );
    }

    const assignmentLog = await AssignedProjectLog.findOne({
      projectId: targetProjectId,
    });

    let tasks: PopulatedTask[] = [];

    if (
      assignmentLog &&
      assignmentLog.tasksIds &&
      assignmentLog.tasksIds.length > 0
    ) {
      const taskIds = assignmentLog.tasksIds;

      tasks = await Task.find({ TaskId: { $in: taskIds } })
        .populate<{ assignedTo: PopulatedAssignee[] }>({
          path: "assignedTo",
          model: User,
          foreignField: "UserId",
          select: "_id UserId firstname lastname profilepic email",
        })

        .lean<PopulatedTask[]>();
    } else {
      console.log(
        `No assignment log or tasks found for project ${targetProjectId}`
      );
    }

    return NextResponse.json({
      success: true,
      projectDetails: projectDetails,
      tasks: tasks,
    });
  } catch (error) {
    console.error(
      `❌ Error fetching project/task details for ${params?.projectId}:`,
      error
    );
    let errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    if (error instanceof Error && error.name === "CastError") {
      errorMessage = `Data relationship error: ${error.message}`;
    }
    return NextResponse.json(
      { success: false, message: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
