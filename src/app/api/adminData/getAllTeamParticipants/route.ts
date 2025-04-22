export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User, { IUser } from "@/models/User";
import Team from "@/models/Team";
import { getToken, GetUserType } from "@/utils/token";

interface IUserWithRole extends IUser {
  UserRole: string;
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }
    const userType = await GetUserType(token);

    if (!userType || userType !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Only Admins can view team participants.",
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const allLeaderIds = await Team.distinct("teamLeader");
    const allMemberIds = await Team.distinct("members");

    const leaderIdSet = new Set(allLeaderIds);
    const memberIdSet = new Set(allMemberIds);

    const allParticipantUserIds = Array.from(
      new Set([...allLeaderIds, ...allMemberIds])
    );

    const participants = await User.find({
      UserId: { $in: allParticipantUserIds },
    }).lean<IUser[]>();

    const participantsWithRoles: IUserWithRole[] = participants.map((user) => {
      const isLeader = leaderIdSet.has(user.UserId);
      const isMember = memberIdSet.has(user.UserId);
      let userRole = "";

      if (isLeader && isMember) {
        userRole = "TeamLeader and TeamMember";
      } else if (isLeader) {
        userRole = "TeamLeader";
      } else if (isMember) {
        userRole = "TeamMember";
      } else {
        userRole = "Unknown Role";
      }

      return {
        ...(user as any),
        UserRole: userRole,
      };
    });

    return NextResponse.json({
      success: true,
      participants: participantsWithRoles,
    });
  } catch (error) {
    console.error("Error fetching team participants:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch team participants. Error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
