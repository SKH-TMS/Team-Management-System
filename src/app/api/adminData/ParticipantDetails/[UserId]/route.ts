import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Team from "@/models/Team";
import { getToken, GetUserType } from "@/utils/token";

export async function GET(
  req: NextRequest,
  { params }: { params: { UserId: string } }
) {
  try {
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
    const requesterUserType = await GetUserType(token);
    if (requesterUserType !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Admin access required to view participant details.",
        },
        { status: 403 }
      );
    }

    const { UserId } = params;
    if (!UserId || typeof UserId !== "string") {
      return NextResponse.json(
        { success: false, message: "Bad Request: Invalid UserId parameter." },
        { status: 400 }
      );
    }

    const normalizedEmail = UserId.toLowerCase();

    await connectToDatabase();
    const user = await User.findOne({ UserId });

    if (!user) {
      return NextResponse.json(
        { success: false, message: `User with UserId ${UserId} not found.` },
        { status: 404 }
      );
    }

    const targetUserId = user.UserId;
    if (!targetUserId) {
      console.error(`User found by UserId ${UserId} but missing UserId.`);
      return NextResponse.json(
        { success: false, message: "Server Error: User data integrity issue." },
        { status: 500 }
      );
    }

    const teamsLed = await Team.find({ teamLeader: targetUserId })
      .select("teamId teamName members teamLeader")
      .lean();

    const teamsMemberOf = await Team.find({
      members: targetUserId,
      teamLeader: { $ne: targetUserId },
    })
      .select("teamId teamName members teamLeader")
      .lean();

    return NextResponse.json({
      success: true,
      user,
      teamsLed: teamsLed,
      teamsMemberOf: teamsMemberOf,
    });
  } catch (error) {
    console.error(
      `❌ Error fetching participant details for UserId ${params?.UserId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch participant details. Error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
