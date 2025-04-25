import { NextRequest, NextResponse } from "next/server";
import { z } from "zod"; // For validation
import { connectToDatabase } from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task"; // Use updated ITask
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs";
import Project, { IProject } from "@/models/Project";
import { getToken, GetUserType } from "@/utils/token";

// Define Zod schema for the request body
const CreateTaskBodySchema = z.object({
  teamId: z.string().trim().min(1, { message: "Team ID is required." }),
  title: z.string().trim().min(1, { message: "Title is required." }),
  description: z
    .string()
    .trim()
    .min(1, { message: "Description is required." }),
  deadline: z.string().datetime({ message: "Invalid deadline format (ISO)." }),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } } // projectId from URL
) {
  let createdTaskDocument: ITask | null = null; // Variable to hold the created task for potential rollback

  try {
    // 1. Extract Project ID from Params (same as before)
    const { projectId } = params;
    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: Project ID is missing in URL.",
        },
        { status: 400 }
      );
    }

    // 2. Authentication & Authorization (same as before)
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
    const userType = await GetUserType(token);
    if (userType !== "ProjectManager") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: User is not a Project Manager.",
        },
        { status: 403 }
      );
    }

    // 3. Parse and Validate Request Body (same as before)
    const body = await req.json();
    const validationResult = CreateTaskBodySchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: `Validation Error: ${errorMessages}` },
        { status: 400 }
      );
    }
    const { teamId, title, description, deadline } = validationResult.data;

    // 4. Database Connection (same as before)
    await connectToDatabase();

    // 5. Find the specific Assigned Project Log (same as before)
    const log: IAssignedProjectLog | null = await AssignedProjectLog.findOne({
      projectId: projectId,
      teamId: teamId,
    });
    if (!log) {
      return NextResponse.json(
        {
          success: false,
          message: `Not Found: No assignment log found for Project ${projectId} and Team ${teamId}.`,
        },
        { status: 404 }
      );
    }

    // 6. Find the Project (same as before)
    const project: IProject | null = await Project.findOne({
      ProjectId: projectId,
    });
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: `Not Found: Project ${projectId} not found.`,
        },
        { status: 404 }
      );
    }

    // 7. Create the New Task (same as before)
    const newTask = new Task({
      title,
      description,
      deadline: new Date(deadline),
      status: "Pending",
      subTasks: [],
    });

    // 8. Save the New Task
    createdTaskDocument = await newTask.save(); // Assign to outer scope variable

    // --- FIX START: Check if task was saved successfully ---
    if (!createdTaskDocument || !createdTaskDocument.TaskId) {
      // This case should ideally not happen if .save() resolves without error,
      // but it's a defensive check.
      throw new Error(
        "Task creation succeeded but document or TaskId is missing."
      );
    }
    // --- FIX END ---

    // 9. Update the Assignment Log with the new TaskId
    log.tasksIds = log.tasksIds || [];
    // Now 'createdTaskDocument' is guaranteed to be non-null here
    log.tasksIds.push(createdTaskDocument.TaskId);
    const updatedLog = await log.save();

    if (!updatedLog) {
      console.error("Failed to update assignment log after task creation.");
      // Rollback logic moved to catch block
      throw new Error("Failed to update assignment log.");
    }

    // 10. Update Project Status (same as before)
    if (project.status === "Pending") {
      project.status = "In Progress";
      await project.save();
    }

    // 11. Success Response
    // 'createdTaskDocument' is guaranteed non-null here
    return NextResponse.json({
      success: true,
      message: "Task created and added to assignment log successfully!",
      task: createdTaskDocument.toObject(),
    });
  } catch (error) {
    console.error("Error creating task:", error);

    // Rollback attempt using the outer scope variable
    // The check 'if (createdTaskDocument ...)' correctly handles the null case
    if (createdTaskDocument && createdTaskDocument.TaskId) {
      try {
        await Task.deleteOne({ TaskId: createdTaskDocument.TaskId });
        console.log(
          `Rolled back task ${createdTaskDocument.TaskId} due to error.`
        );
      } catch (rollbackError) {
        console.error("CRITICAL: Error during task rollback:", rollbackError);
      }
    }

    let message = "Failed to create task.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
