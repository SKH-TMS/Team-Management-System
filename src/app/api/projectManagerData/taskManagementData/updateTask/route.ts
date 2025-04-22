import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task"; // Task model to handle task data
import Team from "@/models/Team";
import { GetUserId, getToken, GetUserType } from "@/utils/token";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { updateTaskSchema } from "@/schemas/taskSchema";
export async function POST(req: NextRequest) {
  try {
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
    let {
      taskId,
      title,
      description,
      assignedTo,
      deadline,
      gitHubUrl,
      context,
    } = await req.json(); // Extract the task data from the request
    // Fetch teams that the user is a team leader for
    if (assignedTo[0] === "all") {
      assignedTo = [];
    }
    const assignedProjectLog = await AssignedProjectLog.findOne({
      tasksIds: taskId,
    });

    await connectToDatabase();
    const team = await Team.findOne({ teamId: assignedProjectLog.teamId });
    // Connect to the database
    // Validate the deadline date
    const parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid deadline date format." },
        { status: 400 }
      );
    }
    if (gitHubUrl && context) {
      const validatedData = updateTaskSchema.safeParse({
        title,
        assignedTo,
        description,
        deadline,
        gitHubUrl,
        context,
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
    } else if (gitHubUrl) {
      const validatedData = updateTaskSchema.safeParse({
        title,
        assignedTo,
        description,
        deadline,
        gitHubUrl,
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
    } else {
      const validatedData = updateTaskSchema.safeParse({
        title,
        assignedTo,
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
    }
    if (assignedTo.length === 0) {
      const members = team.members;

      // Find the task by TaskId and update it
      const updatedTask = await Task.findOneAndUpdate(
        { TaskId: taskId },
        {
          $set: {
            title,
            description,
            assignedTo: members,
            deadline: parsedDeadline.toISOString(),
            gitHubUrl: gitHubUrl || "", // If gitHubUrl is not provided, it will remain an empty string
            context: context || "", // If context is not provided, it will remain an empty string
          },
        },
        { new: true } // Return the updated task
      );

      if (!updatedTask) {
        return NextResponse.json(
          { success: false, message: "Task not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Task updated successfully.",
        task: updatedTask,
      });
    }
    // Find the task by TaskId and update it
    const updatedTask = await Task.findOneAndUpdate(
      { TaskId: taskId },
      {
        $set: {
          title,
          description,
          assignedTo,
          deadline: parsedDeadline.toISOString(),
          gitHubUrl: gitHubUrl || "", // If gitHubUrl is not provided, it will remain an empty string
          context: context || "", // If context is not provided, it will remain an empty string
        },
      },
      { new: true } // Return the updated task
    );

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, message: "Task not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Task updated successfully.",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update task." },
      { status: 500 }
    );
  }
}
