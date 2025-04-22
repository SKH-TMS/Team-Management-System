import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import Team from "@/models/Team";
import { GetUserId, getToken, GetUserRole } from "@/utils/token";
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

    const userrole = GetUserRole(token);
    let isverified = false;
    if (userrole && userrole.includes("TeamLeader")) {
      isverified = true;
    }
    if (!isverified) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a TeamLeader.",
        },
        { status: 401 }
      );
    }
    const {
      taskId,
      title,
      description,
      assignedTo,
      deadline,
      gitHubUrl,
      context,
    } = await req.json();

    const userId = await GetUserId(token);
    const assignedProjectLog = await AssignedProjectLog.findOne({
      tasksIds: taskId,
    });
    await connectToDatabase();
    const team = await Team.findOne({ teamId: assignedProjectLog.teamId });
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

      const updatedTask = await Task.findOneAndUpdate(
        { TaskId: taskId },
        {
          $set: {
            title,
            description,
            assignedTo: members,
            deadline: parsedDeadline.toISOString(),
            gitHubUrl: gitHubUrl || "",
            context: context || "",
          },
        },
        { new: true }
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

    const updatedTask = await Task.findOneAndUpdate(
      { TaskId: taskId },
      {
        $set: {
          title,
          description,
          assignedTo,
          deadline: parsedDeadline.toISOString(),
          gitHubUrl: gitHubUrl || "",
          context: context || "",
        },
      },
      { new: true }
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
