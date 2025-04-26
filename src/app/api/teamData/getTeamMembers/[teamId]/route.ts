// src/app/api/teamData/teamLeaderData/getTeamMembers/[teamId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team, { ITeam } from "@/models/Team";
import User, { IUser } from "@/models/User";
import { getToken, GetUserId } from "@/utils/token";

// Define return type for clarity
type MemberInfo = Pick<
  IUser,
  "UserId" | "firstname" | "lastname" | "email" | "profilepic"
>;

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    // 1. Extract Team ID
    const { teamId } = params;
    if (!teamId) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Team ID is missing in URL." },
        { status: 400 }
      );
    }

    // 2. Authentication & Authorization
    const token = await getToken(req);
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    const userId = await GetUserId(token); // Leader's ID
    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );

    // 3. Database Connection
    await connectToDatabase();

    // 4. Find the Team
    const team: ITeam | null = await Team.findOne({ teamId: teamId });
    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );
    }

    // 5. Authorization Check: Verify user leads this team
    if (!team.teamLeader || !team.teamLeader.includes(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not the leader of this team.",
        },
        { status: 403 }
      );
    }

    // 6. Fetch Member Details (excluding leader if desired)
    // Get the list of member IDs from the team document
    const memberIds = team.members?.filter((id) => id !== userId) || []; // Example: Exclude the leader
    let teamMembers: MemberInfo[] = [];

    if (memberIds.length > 0) {
      // Find all User documents matching the member IDs
      const memberDocs: IUser[] = await User.find({
        UserId: { $in: memberIds },
      }).select("UserId firstname lastname email profilepic"); // Select necessary fields

      // Convert Mongoose documents to plain objects
      teamMembers = memberDocs.map((doc) => doc.toObject());
    }

    // 7. Success Response
    return NextResponse.json({
      success: true,
      members: teamMembers, // Return the array of member info objects
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    let message = "Failed to fetch team members.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
