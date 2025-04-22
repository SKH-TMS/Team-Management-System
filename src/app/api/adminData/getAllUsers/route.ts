export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Team from "@/models/Team";
import { getToken, GetUserType } from "@/utils/token";

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
          message: "Forbidden: Only Admins can view this list.",
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const leaderIds = await Team.distinct("teamLeader");

    const memberIds = await Team.distinct("members");

    const combinedIds = [...leaderIds, ...memberIds];
    const uniqueIdsSet = new Set(combinedIds);

    const userIdsInTeams = Array.from(uniqueIdsSet);
    const usersNotInTeams = await User.find({
      userType: "User",
      UserId: { $nin: userIdsInTeams },
    });

    return NextResponse.json({ success: true, users: usersNotInTeams });
  } catch (error) {
    console.error("Error fetching users not in teams:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch users not in teams. Error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
