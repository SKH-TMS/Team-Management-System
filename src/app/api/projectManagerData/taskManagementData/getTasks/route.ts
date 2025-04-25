export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog, {
  IAssignedProjectLog,
} from "@/models/AssignedProjectLogs";
import Task, { ITask } from "@/models/Task"; // Ensure ITask reflects the *current* model (ideally without assignedTo)
import Project, { IProject } from "@/models/Project";
import Team, { ITeam } from "@/models/Team";
import User, { IUser } from "@/models/User";
import { getToken, GetUserType, GetUserId } from "@/utils/token";

// Define a type for the task object we will return to the frontend
// If your ITask interface *still* has assignedTo (e.g., for compatibility), Omit is needed.
// If ITask is updated and *doesn't* have assignedTo, you can remove Omit.
// Assuming ITask might still have it for now:
type FrontendTask = Omit<ITask, "assignedTo"> & {
  projectId: string;
  projectName: string;
  teamId: string;
  teamName: string;
};

// Define a type for the submitter object
type SubmitterInfo = Pick<
  IUser,
  "UserId" | "firstname" | "lastname" | "email" | "profilepic"
>;

export async function GET(req: NextRequest) {
  try {
    // 1. Authentication and Authorization (same as before)
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
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID not found in token.",
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // 2. Find Assignment Logs (same as before)
    const logs: IAssignedProjectLog[] = await AssignedProjectLog.find({
      assignedBy: userId,
    });

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        success: true,
        tasks: [],
        submitters: [],
        message: "No projects assigned by this manager found.",
      });
    }

    // 3. Process logs (same as before)
    const tasksWithAssignmentDetails: FrontendTask[] = [];
    const submitterUserIdsSet = new Set<string>();

    for (const log of logs) {
      const project: IProject | null = await Project.findOne({
        ProjectId: log.projectId,
      });
      const team: ITeam | null = await Team.findOne({ teamId: log.teamId });
      const projectName = project ? project.title : "Unknown Project";
      const teamName = team ? team.teamName : "Unknown Team";

      if (!log.tasksIds || log.tasksIds.length === 0) {
        continue;
      }

      const tasksInLog: ITask[] = await Task.find({
        TaskId: { $in: log.tasksIds },
      });

      for (const task of tasksInLog) {
        const taskObject = task.toObject(); // Get plain object

        // Add submitter ID if valid
        if (
          taskObject.submittedby &&
          taskObject.submittedby !== "Not-submitted"
        ) {
          // Ensure submittedby is treated as string if it exists
          submitterUserIdsSet.add(String(taskObject.submittedby));
        }

        // --- FIX START ---
        // Create the base object by spreading and adding new properties
        const combinedTaskData = {
          ...taskObject,
          projectId: log.projectId,
          projectName: projectName,
          teamId: log.teamId,
          teamName: teamName,
        };

        // Explicitly delete the 'assignedTo' property IF it exists on the combined object
        // This handles cases where taskObject might still have it from old data
        // Use 'as any' because TS doesn't know about dynamic deletion easily
        if ("assignedTo" in combinedTaskData) {
          delete (combinedTaskData as any).assignedTo;
        }

        // Now, the combinedTaskData object should match the FrontendTask structure
        // We can assert the type here for clarity or let TS infer if confident
        tasksWithAssignmentDetails.push(combinedTaskData as FrontendTask);
        // --- FIX END ---
      }
    }

    // 4. Fetch Submitter Details (same as before)
    const submittedUserIds = Array.from(submitterUserIdsSet);
    let submitters: SubmitterInfo[] = [];
    if (submittedUserIds.length > 0) {
      const submitterDocs: IUser[] = await User.find({
        UserId: { $in: submittedUserIds },
      }).select("UserId firstname lastname email profilepic");

      submitters = submitterDocs.map((doc) => ({
        UserId: doc.UserId,
        firstname: doc.firstname,
        lastname: doc.lastname,
        email: doc.email,
        profilepic: doc.profilepic,
      }));
    }

    // 5. Return Response (same as before)
    return NextResponse.json({
      success: true,
      tasks: tasksWithAssignmentDetails,
      submitters: submitters,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    let message = "An error occurred while fetching tasks.";
    // Basic check if it's an error object
    if (typeof error === "object" && error !== null && "message" in error) {
      // Check if message is string before assigning
      if (typeof error.message === "string") {
        message = error.message;
      }
    }
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching tasks." }, // Keep generic message for client
      { status: 500 }
    );
  }
}
