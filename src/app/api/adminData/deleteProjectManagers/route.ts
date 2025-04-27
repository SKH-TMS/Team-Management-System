// src/app/api/projectManagerData/teamManagementData/deleteProjectManagers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Task from "@/models/Task";
import Subtask from "@/models/Subtask"; // Import Subtask model
import Project from "@/models/Project";
import User from "@/models/User";
import Admin from "@/models/Admin";
import { getToken, GetUserId, GetUserType } from "@/utils/token";
import mongoose from "mongoose";

// Define the structure for detailed results
interface ProcessingResults {
  validPmEmailsProcessed: string[];
  validPmUserIdsProcessed: string[];
  invalidOrSkippedEmails: { email: string; reason: string }[];
  deletedProjectsCount: number;
  deletedTeamsCount: number;
  deletedAssignmentsCount: number;
  deletedTasksCount: number;
  deletedSubtasksCount: number; // Added counter
  deletedUsersCount: number;
}

const emailRegex =
  /^(?!.*\.\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/;

export async function POST(req: NextRequest) {
  // Using POST as per previous refinement
  const processingResults: ProcessingResults = {
    validPmEmailsProcessed: [],
    validPmUserIdsProcessed: [],
    invalidOrSkippedEmails: [],
    deletedProjectsCount: 0,
    deletedTeamsCount: 0,
    deletedAssignmentsCount: 0,
    deletedTasksCount: 0,
    deletedSubtasksCount: 0, // Initialize counter
    deletedUsersCount: 0,
  };

  try {
    // 1. Authentication & Admin Verification
    const token = await getToken(req);
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );

    const adminUserType = await GetUserType(token);
    const adminUserId = await GetUserId(token);

    if (adminUserType !== "Admin")
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    if (!adminUserId)
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin User ID not found." },
        { status: 401 }
      );

    await connectToDatabase();

    const adminUser = await Admin.findOne(
      { AdminId: adminUserId },
      { email: 1 }
    );
    if (!adminUser)
      return NextResponse.json(
        {
          success: false,
          message: "Server Error: Could not verify admin identity.",
        },
        { status: 500 }
      );
    const adminEmail = adminUser.email;

    // 2. Input Validation
    let body;
    try {
      body = await req.json();
      console.log("Received request body:", body);
    } catch (jsonError) {
      if (jsonError instanceof SyntaxError) {
        console.error("Error parsing request JSON:", jsonError.message);
        return NextResponse.json(
          { success: false, message: "Bad Request: Invalid JSON payload." },
          { status: 400 }
        );
      }
      throw jsonError;
    }

    const pmEmailsToDeleteInput: unknown = body.emails;

    if (
      !Array.isArray(pmEmailsToDeleteInput) ||
      pmEmailsToDeleteInput.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Bad Request: 'emails' array is required and cannot be empty.",
        },
        { status: 400 }
      );
    }

    // 3. Filter and Validate Emails
    console.log("Admin Email:", adminEmail);
    const potentialPmEmails = pmEmailsToDeleteInput
      .filter((email): email is string => {
        // ... (filtering logic remains the same) ...
        console.log(`Filtering email: ${email}`);
        if (typeof email !== "string" || !emailRegex.test(email)) {
          console.log(`-> Invalid format: ${email}`);
          processingResults.invalidOrSkippedEmails.push({
            email: String(email),
            reason: "Invalid email format",
          });
          return false;
        }
        const inputLower = email.toLowerCase();
        const adminLower = adminEmail.toLowerCase();
        console.log(`-> Comparing '${inputLower}' === '${adminLower}'`);
        if (inputLower === adminLower) {
          console.log(`-> Skipping admin email: ${email}`);
          processingResults.invalidOrSkippedEmails.push({
            email: email,
            reason: "Admin cannot delete self",
          });
          return false;
        }
        console.log(`-> Keeping email: ${email}`);
        return true;
      })
      .map((email) => email.toLowerCase());

    const uniquePotentialPmEmails = Array.from(new Set(potentialPmEmails));
    console.log(
      "Unique potential PM emails after filtering:",
      uniquePotentialPmEmails
    );

    if (uniquePotentialPmEmails.length === 0) {
      const message =
        pmEmailsToDeleteInput.length > 0
          ? "No valid Project Manager emails provided for deletion after filtering (check format or admin email)."
          : "Bad Request: No emails provided.";
      console.error(
        "Validation failed:",
        message,
        "Skipped/Invalid:",
        processingResults.invalidOrSkippedEmails
      );
      return NextResponse.json(
        { success: false, message: message, details: processingResults },
        { status: 400 }
      );
    }

    // 4. Identify Valid PM Users
    const usersFound = await User.find(
      { email: { $in: uniquePotentialPmEmails } },
      { UserId: 1, userType: 1, email: 1 }
    );

    const usersFoundMap = new Map(
      usersFound.map((u) => [
        u.email.toLowerCase(),
        { userId: u.UserId, userType: u.userType },
      ])
    );

    uniquePotentialPmEmails.forEach((email) => {
      const userData = usersFoundMap.get(email);
      if (userData && userData.userType === "ProjectManager") {
        processingResults.validPmEmailsProcessed.push(email);
        processingResults.validPmUserIdsProcessed.push(userData.userId);
      } else if (userData) {
        processingResults.invalidOrSkippedEmails.push({
          email: email,
          reason: `Not a Project Manager (Type: ${userData.userType})`,
        });
      } else {
        processingResults.invalidOrSkippedEmails.push({
          email: email,
          reason: "User not found",
        });
      }
    });

    const validPmUserIds = processingResults.validPmUserIdsProcessed;
    const validPmEmails = processingResults.validPmEmailsProcessed;

    if (validPmUserIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No valid Project Managers found to delete based on provided emails.",
          details: processingResults,
        },
        { status: 404 }
      );
    }

    console.log(
      `Initiating deletion cascade for ${validPmEmails.length} Project Managers (Emails):`,
      validPmEmails
    );
    console.log(`Corresponding UserIds:`, validPmUserIds);

    // 5. Identify Associated Data for Deletion
    const projectIdsToDeleteSet = new Set<string>();
    const teamIdsToDeleteSet = new Set<string>();
    const assignmentIdsToDeleteSet = new Set<mongoose.Types.ObjectId>();
    const taskIdsToDeleteSet = new Set<string>();

    const projectsToDelete = await Project.find(
      { createdBy: { $in: validPmUserIds } },
      { ProjectId: 1 }
    );
    projectsToDelete.forEach((p) => projectIdsToDeleteSet.add(p.ProjectId));
    console.log(
      `Found ${projectIdsToDeleteSet.size} unique projects created by PMs to delete.`
    );

    const teamsToDelete = await Team.find(
      { createdBy: { $in: validPmUserIds } },
      { teamId: 1 }
    );
    teamsToDelete.forEach((t) => teamIdsToDeleteSet.add(t.teamId));
    console.log(
      `Found ${teamIdsToDeleteSet.size} unique teams created by PMs to delete.`
    );

    const assignmentsToDelete = await AssignedProjectLog.find(
      { assignedBy: { $in: validPmUserIds } },
      { _id: 1, tasksIds: 1 }
    );
    assignmentsToDelete.forEach((a) => {
      assignmentIdsToDeleteSet.add(a._id);
      if (a.tasksIds && Array.isArray(a.tasksIds)) {
        a.tasksIds.forEach((taskId: string) => taskIdsToDeleteSet.add(taskId));
      }
    });
    console.log(
      `Found ${assignmentIdsToDeleteSet.size} unique assignments made by PMs to delete.`
    );
    console.log(
      `Found ${taskIdsToDeleteSet.size} unique tasks associated with those assignments.`
    );

    const taskIdsToDelete = Array.from(taskIdsToDeleteSet);
    const assignmentIdsToDelete = Array.from(assignmentIdsToDeleteSet);
    const teamIdsToDelete = Array.from(teamIdsToDeleteSet);
    const projectIdsToDelete = Array.from(projectIdsToDeleteSet);
    let subtaskIdsToDelete: string[] = [];

    // 6. Identify Subtasks associated with the identified Tasks
    if (taskIdsToDelete.length > 0) {
      const tasksWithSubtasks = await Task.find(
        { TaskId: { $in: taskIdsToDelete } },
        { subTasks: 1, _id: 0 } // Only fetch subTasks field
      );
      const subtaskIdsSet = new Set<string>();
      tasksWithSubtasks.forEach((task) => {
        if (Array.isArray(task.subTasks)) {
          task.subTasks.forEach((subtaskId: string) => {
            // Explicit type
            if (typeof subtaskId === "string" && subtaskId.length > 0) {
              subtaskIdsSet.add(subtaskId);
            }
          });
        }
      });
      subtaskIdsToDelete = Array.from(subtaskIdsSet);
      console.log(
        `Found ${subtaskIdsToDelete.length} unique subtasks to delete.`
      );
    }

    // --- Deletion Cascade ---
    // Order: Subtasks -> Tasks -> Assignments -> Projects/Teams -> Users

    // 7. Delete Subtasks  <--- ADDED THIS STEP
    if (subtaskIdsToDelete.length > 0) {
      console.log(`Deleting ${subtaskIdsToDelete.length} subtasks...`);
      const subtaskDeletionResult = await Subtask.deleteMany({
        SubtaskId: { $in: subtaskIdsToDelete }, // Assuming Subtask model uses 'SubtaskId'
      });
      processingResults.deletedSubtasksCount =
        subtaskDeletionResult.deletedCount;
      console.log(
        `Subtasks deleted: ${processingResults.deletedSubtasksCount}`
      );
    }

    // 8. Delete Tasks (Original Step 7)
    if (taskIdsToDelete.length > 0) {
      console.log(`Deleting ${taskIdsToDelete.length} tasks...`);
      const taskDeletionResult = await Task.deleteMany({
        TaskId: { $in: taskIdsToDelete },
      });
      processingResults.deletedTasksCount = taskDeletionResult.deletedCount;
      console.log(`Tasks deleted: ${processingResults.deletedTasksCount}`);
    }

    // 9. Delete Assignments (Original Step 8)
    if (assignmentIdsToDelete.length > 0) {
      console.log(`Deleting ${assignmentIdsToDelete.length} assignments...`);
      const assignmentDeletionResult = await AssignedProjectLog.deleteMany({
        _id: { $in: assignmentIdsToDelete },
      });
      processingResults.deletedAssignmentsCount =
        assignmentDeletionResult.deletedCount;
      console.log(
        `Assignments deleted: ${processingResults.deletedAssignmentsCount}`
      );
    }

    // 10. Delete Teams (Original Step 9)
    if (teamIdsToDelete.length > 0) {
      console.log(`Deleting ${teamIdsToDelete.length} teams created by PMs...`);
      const teamDeletionResult = await Team.deleteMany({
        teamId: { $in: teamIdsToDelete },
        createdBy: { $in: validPmUserIds },
      });
      processingResults.deletedTeamsCount = teamDeletionResult.deletedCount;
      console.log(`Teams deleted: ${processingResults.deletedTeamsCount}`);
    }

    // 11. Delete Projects (Original Step 10)
    if (projectIdsToDelete.length > 0) {
      console.log(
        `Deleting ${projectIdsToDelete.length} projects created by PMs...`
      );
      const projectDeletionResult = await Project.deleteMany({
        ProjectId: { $in: projectIdsToDelete },
        createdBy: { $in: validPmUserIds },
      });
      processingResults.deletedProjectsCount =
        projectDeletionResult.deletedCount;
      console.log(
        `Projects deleted: ${processingResults.deletedProjectsCount}`
      );
    }

    // 12. Delete PM Users (Original Step 11)
    console.log(
      `Deleting ${validPmEmails.length} Project Manager users by email...`
    );
    const userDeletionResult = await User.deleteMany({
      email: { $in: validPmEmails },
      userType: "ProjectManager",
    });
    processingResults.deletedUsersCount = userDeletionResult.deletedCount;
    console.log(
      `Project Manager users deleted: ${processingResults.deletedUsersCount}`
    );

    // 13. Final Response (Original Step 12)
    const status =
      processingResults.invalidOrSkippedEmails.length > 0 ? 207 : 200;
    const overallSuccess = status === 200;

    return NextResponse.json(
      {
        success: overallSuccess,
        // Updated message to include subtasks
        message: `Deletion process completed. ${processingResults.deletedUsersCount} PM(s) deleted. ${processingResults.invalidOrSkippedEmails.length} email(s) were invalid or skipped. Associated data deleted: ${processingResults.deletedProjectsCount} projects, ${processingResults.deletedTeamsCount} teams, ${processingResults.deletedAssignmentsCount} assignments, ${processingResults.deletedTasksCount} tasks, ${processingResults.deletedSubtasksCount} subtasks.`,
        details: processingResults,
      },
      { status: status }
    );
  } catch (error) {
    console.error(
      `❌ Error during bulk Project Manager deletion by email:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        message: `Server error during bulk Project Manager deletion: ${errorMessage}`,
        details: processingResults,
      },
      { status: 500 }
    );
  }
}
