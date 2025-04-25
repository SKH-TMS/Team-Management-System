// src/app/api/projectManagerData/taskManagementData/getProjectTasks/[projectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs"; // Import interface
import Task, { ITask } from "@/models/Task"; // Import interface
import User, { IUser } from "@/models/User"; // Import interface for Submitters
import Project, { IProject } from "@/models/Project"; // Import interface
import { getToken, GetUserType, GetUserId } from "@/utils/token";

// Define a type for the submitter object (can be shared or defined locally)
type SubmitterInfo = Pick<
  IUser,
  "UserId" | "firstname" | "lastname" | "email" | "profilepic"
>;

export async function GET(
  req: NextRequest, // Keep req for getToken
  { params }: { params: { projectId: string } }
) {
  try {
    // 1. Extract Project ID
    const { projectId } = params;
    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Project ID is missing." },
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
    const projectManagerId = await GetUserId(token);
    if (!projectManagerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID not found in token.",
        },
        { status: 401 }
      );
    }

    // 3. Database Connection
    await connectToDatabase();

    // 4. Find the AssignedProjectLog for this project AND created by this PM
    const log: IAssignedProjectLog | null = await AssignedProjectLog.findOne({
      projectId: projectId,
      assignedBy: projectManagerId, // Authorization check
    });

    if (!log) {
      // If no log found for this project *and* this PM, deny access
      return NextResponse.json(
        {
          success: false,
          message: `Not Found or Forbidden: No assignment log found for Project ${projectId} managed by you.`,
        },
        { status: 404 } // Or 403
      );
    }

    // 5. Fetch Project Details (Title)
    const project: IProject | null = await Project.findOne({
      ProjectId: log.projectId, // Use projectId from the validated log
    }).select("title"); // Select only title

    if (!project) {
      console.error(
        `Data inconsistency: Log found for non-existent project ${log.projectId}`
      );
      // Return empty task list but indicate project title issue? Or return error?
      // Let's return an error for clarity.
      return NextResponse.json(
        {
          success: false,
          message: `Not Found: Project details could not be retrieved for ID ${log.projectId}.`,
        },
        { status: 404 }
      );
    }
    const projectTitle = project.title;

    // 6. Fetch Tasks associated with this log
    const tasksIds = log.tasksIds;
    let tasks: ITask[] = []; // Use ITask type
    if (tasksIds && tasksIds.length > 0) {
      // Fetch full task documents
      tasks = await Task.find({ TaskId: { $in: tasksIds } });
      // Ensure assignedTo is not present if using older ITask definition
      // tasks = tasks.map(t => { const obj = t.toObject(); delete obj.assignedTo; return obj; });
    }

    // 7. REMOVED: Logic to fetch members based on 'assignedTo'

    // 8. Fetch Submitter Details (Keep this logic)
    const submitterUserIdsSet = new Set<string>();
    tasks.forEach((task) => {
      if (task.submittedby && task.submittedby !== "Not-submitted") {
        submitterUserIdsSet.add(task.submittedby);
      }
    });

    const submittedUserIds = Array.from(submitterUserIdsSet);
    let submitters: SubmitterInfo[] = [];
    if (submittedUserIds.length > 0) {
      const submitterDocs: IUser[] = await User.find({
        UserId: { $in: submittedUserIds },
      }).select("UserId firstname lastname email profilepic"); // Select specific fields

      submitters = submitterDocs.map((doc) => ({
        UserId: doc.UserId,
        firstname: doc.firstname,
        lastname: doc.lastname,
        email: doc.email,
        profilepic: doc.profilepic,
      }));
    }

    // 9. Success Response
    return NextResponse.json({
      success: true,
      tasks: tasks.map((t) => t.toObject()), // Return plain objects
      submitters: submitters,
      title: projectTitle, // Send project title
      // REMOVED: members field
    });
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    let message = "Failed to fetch project tasks.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
