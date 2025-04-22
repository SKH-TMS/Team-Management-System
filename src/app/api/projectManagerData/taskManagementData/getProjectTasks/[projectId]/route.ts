import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Task from "@/models/Task";
import User from "@/models/User";
import { getToken, GetUserType } from "@/utils/token";
import Project from "@/models/Project";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
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
    const { projectId } = params;
    await connectToDatabase();

    // Find the AssignedProjectLog document for the given projectId.
    const log = await AssignedProjectLog.findOne({ projectId });
    if (!log) {
      return NextResponse.json(
        {
          success: false,
          message: "No assigned project log found for this project.",
        },
        { status: 404 }
      );
    }

    const project = await Project.findOne({ ProjectId: log.projectId });

    // Extract task IDs from the log and fetch the tasks.
    const tasksIds = log.tasksIds;
    let tasks: any[] = [];
    if (tasksIds && tasksIds.length > 0) {
      tasks = await Task.find({ TaskId: { $in: tasksIds } });
    }

    // Gather unique IDs for users assigned (from task.assignedTo)
    const assignedUserIds = Array.from(
      new Set(tasks.flatMap((task: any) => task.assignedTo))
    );
    let members: any[] = [];
    if (assignedUserIds.length > 0) {
      members = await User.find({ UserId: { $in: assignedUserIds } });
    }

    // Gather unique submittedby user IDs from tasks.
    const submittedUserIds = Array.from(
      new Set(
        tasks
          .map((task: any) => task.submittedby)
          .filter((id: string) => id && id !== "Not-submitted")
      )
    );
    let submitters: any[] = [];
    if (submittedUserIds.length > 0) {
      submitters = await User.find({
        UserId: { $in: submittedUserIds },
      });
    }
    return NextResponse.json({
      success: true,
      tasks,
      members,
      submitters,
      title: project.title,
    });
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch project tasks." },
      { status: 500 }
    );
  }
}
