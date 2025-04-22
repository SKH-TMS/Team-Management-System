import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";
import Task from "@/models/Task";
import { ITask } from "@/models/Task";
import { getToken, GetUserType } from "@/utils/token";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { createTaskSchema } from "@/schemas/taskSchema";
import Project from "@/models/Project";
export async function POST(req: NextRequest) {
  let taskid;
  try {
    // Extract token and verify user
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }
    const usertype = await GetUserType(token);
    if (usertype !== "ProjectManager") {
      return NextResponse.json(
        { success: false, message: "You are not a projectManager." },
        { status: 401 }
      );
    }
    const { assignedTo, title, description, deadline, projectId } =
      await req.json();

    if (!assignedTo || !title || !description || !deadline || !projectId) {
      return NextResponse.json(
        { success: false, message: "Enter all values" },
        { status: 403 }
      );
    }
    // Connect to the database
    await connectToDatabase();
    const logs = await AssignedProjectLog.findOne({ projectId });
    const team = await Team.findOne({ teamId: logs.teamId });
    const teamId = team.teamId;
    if (assignedTo.length === 0) {
      const members = team.members;
      // Validate request data using Zod schema
      const validatedData = createTaskSchema.safeParse({
        projectId,
        teamId,
        title,
        assignedTo,
        description,
        deadline,
        status: "Pending",
      });
      if (!validatedData.success) {
        // If validation fails, return an error with the validation message
        const errorMessages = validatedData.error.errors
          .map((err) => err.message)
          .join(", ");
        return NextResponse.json(
          { success: false, message: errorMessages },
          { status: 402 }
        );
      }
      const project = await Project.findOne({ ProjectId: projectId });
      if (!project) {
        return NextResponse.json({
          success: true,
          message: "Project not found in database",
        });
      }

      // Create a new task
      const newTask: ITask = new Task({
        title,
        description,
        assignedTo: members,
        projectId,
        teamId,
        deadline,
        status: "Pending", // Default status
      });

      // Save the new task to the database
      await newTask.save();
      taskid = newTask.TaskId; // DEFIEND FOR error handeling
      // find AssignedProjectLogs to include the new task ID and projectId
      const assignedProjectLog = await AssignedProjectLog.findOne({
        projectId,
        teamId: team.teamId,
      });

      if (!logs) {
        Task.deleteOne({ TaskId: newTask.TaskId });
        return NextResponse.json(
          { success: false, message: "Assigned project log not found." },
          { status: 404 }
        );
      }

      let taskids: string[] = logs.tasksIds;
      taskids.push(newTask.TaskId);
      const updatelogs = await AssignedProjectLog.findOneAndUpdate(
        { AssignProjectId: assignedProjectLog.AssignProjectId },
        { tasksIds: taskids },
        { new: true }
      );
      if (!updatelogs) {
        Task.deleteOne({ TaskId: newTask.TaskId });
        return NextResponse.json(
          {
            success: false,
            message: "Failed to update the assigned project log.",
          },
          { status: 500 }
        );
      }
      if (project.status === "Pending") {
        project.status = "In Progress";
        await project.save();
      }
      return NextResponse.json({
        success: true,
        message: "Task assigned successfully!",
        task: newTask,
      });
    }

    // Check if the assigned user exists
    const assignedUser = await User.findOne({ UserId: assignedTo });
    if (!assignedUser) {
      return NextResponse.json(
        { success: false, message: "Assigned user not found." },
        { status: 404 }
      );
    }
    // Validate request data using Zod schema
    const validatedData = createTaskSchema.safeParse({
      projectId,
      teamId: team.teamId,
      assignedTosingle: assignedTo[0].toString(),
      title,
      description,
      deadline,
      status: "Pending",
    });
    if (!validatedData.success) {
      // If validation fails, return an error with the validation message
      const errorMessages = validatedData.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: errorMessages },
        { status: 400 }
      );
    }
    const project = await Project.findOne({ ProjectId: projectId });
    if (!project) {
      return NextResponse.json({
        success: true,
        message: "Project not found in database",
      });
    }

    // Create a new task
    const newTask: ITask = new Task({
      title,
      description,
      assignedTo,
      projectId,
      teamId: team.teamId,
      deadline,
      status: "Pending", // Default status
    });

    // Save the new task to the database
    await newTask.save();
    taskid = newTask.TaskId; // DEFIEND FOR error handeling
    // find AssignedProjectLogs to include the new task ID and projectId

    if (!logs) {
      Task.deleteOne({ TaskId: newTask.TaskId });
      return NextResponse.json(
        { success: false, message: "Assigned project log not found." },
        { status: 404 }
      );
    }
    let taskids: string[] = logs.tasksIds;
    taskids.push(newTask.TaskId);
    const updatelogs = await AssignedProjectLog.findOneAndUpdate(
      { AssignProjectId: logs.AssignProjectId },
      { tasksIds: taskids },
      { new: true }
    );
    if (!updatelogs) {
      Task.deleteOne({ TaskId: newTask.TaskId });
      return NextResponse.json(
        {
          success: false,
          message: "Failed to update the assigned project log.",
        },
        { status: 500 }
      );
    }
    if (project.status === "Pending") {
      project.status = "In Progress";
      await project.save();
    }

    return NextResponse.json({
      success: true,
      message: "Task assigned successfully!",
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch teams." },
      { status: 500 }
    );
  }
}
