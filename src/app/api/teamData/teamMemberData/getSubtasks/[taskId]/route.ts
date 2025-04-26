// src/app/api/teamData/teamMemberData/getsubtasks/[taskId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task";
import Subtask, { ISubtask } from "@/models/Subtask";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Team, { ITeam } from "@/models/Team";
import User, { IUser } from "@/models/User";
import { getToken, GetUserId } from "@/utils/token";

export type MemberInfo = {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
};

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const parentTaskId = params.taskId;
    if (!parentTaskId) {
      return NextResponse.json(
        { success: false, message: "Missing taskId" },
        { status: 400 }
      );
    }

    // 1. Auth
    const token = await getToken(req);
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    const userId = await GetUserId(token);
    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    // 2. DB
    await connectToDatabase();

    // 3. Parent task
    const parentTask = await Task.findOne({ TaskId: parentTaskId })
      .select("TaskId title description deadline status createdAt updatedAt")
      .lean<ITask>();
    if (!parentTask) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    // 4. Assignment log
    const log = await AssignedProjectLog.findOne({
      tasksIds: parentTaskId,
    }).lean<{
      teamId: string;
    }>();
    if (!log) {
      return NextResponse.json(
        { success: false, message: "Assignment not found" },
        { status: 500 }
      );
    }

    // 5. Team membership
    const team = await Team.findOne({ teamId: log.teamId })
      .select("members")
      .lean<Pick<ITeam, "members">>();
    if (!team || !team.members.includes(userId)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // 6. Load subtasks
    const subtaskDocs = await Subtask.find({ parentTaskId }).sort({
      deadline: 1,
    });

    // 7. Gather all assigned userIds
    const assignSet = new Set<string>();
    subtaskDocs.forEach((doc: ISubtask) => {
      const arr = Array.isArray(doc.assignedTo)
        ? doc.assignedTo
        : [doc.assignedTo];
      arr.forEach((uid: string) => assignSet.add(uid));
    });

    // 8. Fetch members
    let membersInfo: MemberInfo[] = [];
    if (assignSet.size > 0) {
      const users = await User.find({
        UserId: { $in: Array.from(assignSet) },
      }).select("UserId firstname lastname profilepic email");
      membersInfo = users.map((u: IUser) => ({
        UserId: u.UserId,
        firstname: u.firstname,
        lastname: u.lastname,
        email: u.email,
        profilepic: u.profilepic.toString(),
      }));
    }

    // 9. Build final array
    const subtasks = subtaskDocs.map((doc: ISubtask) => {
      const s = doc.toObject() as ISubtask;
      const arr = Array.isArray(s.assignedTo) ? s.assignedTo : [s.assignedTo];
      const assignedMembers = membersInfo.filter((m) => arr.includes(m.UserId));
      return { ...s, assignedMembers };
    });

    // 10. Return
    return NextResponse.json({
      success: true,
      parentTask,
      subtasks,
      currentUserId: userId,
    });
  } catch (err: any) {
    console.error("Error in getsubtasks:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
