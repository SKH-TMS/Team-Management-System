import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import User from "@/models/User";
import { ITask } from "@/models/Task";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { createTaskSchema } from "@/schemas/taskSchema";
import Team from "@/models/Team";
import { getToken, GetUserType } from "@/utils/token";
import Project from "@/models/Project";
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  let taskid;
  try {
    const { projectId } = params;
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }
    // Check if the user is a ProjectManager
    const userType = await GetUserType(token);
    if (!userType || userType !== "ProjectManager") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access. You are not a Project Manager.",
        },
        { status: 401 }
      );
    }
    const { teamId, assignedTo, title, description, deadline } =
      await req.json();
    // Validate incoming data
    if (!projectId || !teamId || !title || !description || !deadline) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    if (assignedTo[0] === "__none" || assignedTo.length === 0) {
      const team = await Team.findOne({ teamId });
      const members = team.members;
      // Validate request data using Zod schema
      const validatedData = createTaskSchema.safeParse({
        projectId,
        teamId,
        title,
        description,
        deadline,
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
      if (project.status === "Pending") {
        project.status = "In Progress";
        await project.save();
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
        teamId,
      });

      if (!assignedProjectLog) {
        Task.deleteOne({ TaskId: newTask.TaskId });
        return NextResponse.json(
          { success: false, message: "Assigned project log not found." },
          { status: 404 }
        );
      }

      let taskids: string[] = assignedProjectLog.tasksIds;
      taskids.push(newTask.TaskId);
      const updateassignedProjectLog =
        await AssignedProjectLog.findOneAndUpdate(
          { AssignProjectId: assignedProjectLog.AssignProjectId },
          { tasksIds: taskids },
          { new: true }
        );
      if (!updateassignedProjectLog) {
        Task.deleteOne({ TaskId: newTask.TaskId });
        return NextResponse.json(
          {
            success: false,
            message: "Failed to update the assigned project log.",
          },
          { status: 500 }
        );
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
      teamId,
      assignedTosingle: assignedTo,
      title,
      description,
      deadline,
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
    if (project.status === "Pending") {
      project.status = "In Progress";
      await project.save();
    }
    // Create a new task
    const newTask: ITask = new Task({
      title,
      description,
      assignedTo,
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
      teamId,
    });

    if (!assignedProjectLog) {
      Task.deleteOne({ TaskId: newTask.TaskId });
      return NextResponse.json(
        { success: false, message: "Assigned project log not found." },
        { status: 404 }
      );
    }
    let taskids: string[] = assignedProjectLog.tasksIds;
    taskids.push(newTask.TaskId);
    const updateassignedProjectLog = await AssignedProjectLog.findOneAndUpdate(
      { AssignProjectId: assignedProjectLog.AssignProjectId },
      { tasksIds: taskids },
      { new: true }
    );
    if (!updateassignedProjectLog) {
      Task.deleteOne({ TaskId: newTask.TaskId });
      return NextResponse.json(
        {
          success: false,
          message: "Failed to update the assigned project log.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Task assigned successfully!",
      task: newTask,
    });
  } catch (error) {
    Task.deleteOne({ TaskId: taskid });
    console.error("Error assigning task:", error);
    return NextResponse.json(
      { success: false, message: "Failed to assign task." },
      { status: 500 }
    );
  }
}
