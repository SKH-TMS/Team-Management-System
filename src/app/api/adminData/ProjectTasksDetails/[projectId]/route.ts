import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project, { IProject } from "@/models/Project";
import Task, { ITask } from "@/models/Task";
import User, { IUser } from "@/models/User";
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs";
import { getToken, GetUserType } from "@/utils/token";
import mongoose from "mongoose";

// Interface for the fields we expect after populating a User reference (for submitter)
interface PopulatedMember {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic?: string;
  email: string;
}

// Interface for the Task document after potential population of submitter
// NOTE: Removed assignedTo from this interface as it's not on the Task model
interface PopulatedTask extends Omit<ITask, "submittedby"> {
  // Omit original submittedby if it was just ID
  _id: mongoose.Types.ObjectId | string;
  // assignedTo is NOT populated here because it's not on the Task schema
  submittedby?: PopulatedMember | null; // Can be populated member or null
}

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const targetProjectId = params.projectId;

    // 1. Authentication & Authorization
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

    // 2. Database Connection
    await connectToDatabase();

    // 3. Fetch Project Details
    const projectDetails = await Project.findOne({
      ProjectId: targetProjectId,
    }).lean<IProject>();

    if (!projectDetails) {
      return NextResponse.json(
        { success: false, message: "Project not found." },
        { status: 404 }
      );
    }

    // 4. Find Assignment Log to get Task IDs
    const assignmentLog = await AssignedProjectLog.findOne({
      projectId: targetProjectId,
    }).lean<IAssignedProjectLog>();

    let tasks: PopulatedTask[] = []; // Use the updated interface

    if (
      assignmentLog &&
      assignmentLog.tasksIds &&
      Array.isArray(assignmentLog.tasksIds) &&
      assignmentLog.tasksIds.length > 0
    ) {
      const taskIds = assignmentLog.tasksIds;

      // 5. Fetch Tasks and Populate ONLY Submitter (if Task schema has 'submittedby')
      tasks = await Task.find({ TaskId: { $in: taskIds } })
        // REMOVED: .populate for 'assignedTo' as it's not on the Task schema
        .populate<{ submittedby?: PopulatedMember | null }>({
          // Populate submittedby (if exists on Task schema)
          path: "submittedby",
          model: User,
          foreignField: "UserId", // Match Task.submittedby string ID with User.UserId
          select: "UserId firstname lastname profilepic email -_id",
        })
        .lean<PopulatedTask[]>(); // Use the updated interface for lean result
    } else {
      console.log(
        `No assignment log or tasks found for project ${targetProjectId}`
      );
    }

    // 6. Return Response
    return NextResponse.json({
      success: true,
      projectDetails: projectDetails,
      tasks: tasks, // Tasks will NOT have an assignedTo field populated here
    });
  } catch (error) {
    console.error(
      `❌ Error fetching project/task details for ${params?.projectId}:`,
      error
    );
    let errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    if (error instanceof mongoose.Error.CastError) {
      errorMessage = `Invalid ID format provided: ${error.message}`;
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.name === "ValidationError") {
      errorMessage = `Data validation error: ${error.message}`;
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }
    // Handle the specific populate error gracefully if it occurs for 'submittedby'
    if (
      error instanceof Error &&
      error.message.includes("Cannot populate path") &&
      error.message.includes("because it is not in your schema")
    ) {
      console.warn(
        `Attempted to populate a non-existent path: ${error.message}`
      );
      // Decide how to proceed. Maybe return tasks without population?
      // For now, let it fall through to the generic 500 error,
      // or add specific logic to fetch tasks without populate if this happens.
    }

    return NextResponse.json(
      { success: false, message: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
