// src/app/api/teamData/teamLeaderData/getLedTeams/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team, { ITeam } from "@/models/Team";
import { getToken, GetUserId } from "@/utils/token"; // Assuming these utils correctly extract user ID

// Define the specific fields we want to return for each team
type TeamInfo = Pick<ITeam, "teamId" | "teamName">;

export async function GET(req: NextRequest) {
  try {
    // 1. Authentication: Get User ID from token
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID not found in token.",
        },
        { status: 401 }
      );
    }

    // 2. Database Connection
    await connectToDatabase();

    // 3. Find Teams where the user is a leader
    // We only need teamId and teamName for the dropdown
    const teams: TeamInfo[] = await Team.find(
      { teamLeader: userId } // Query criteria: userId must be in the teamLeader array
    ).select("teamId teamName -_id"); // Select only teamId and teamName, exclude the default _id

    // 4. Success Response
    // Return the found teams (or an empty array if the user leads no teams)
    return NextResponse.json({
      success: true,
      teams: teams,
    });
  } catch (error) {
    console.error("Error fetching led teams:", error);
    let message = "Failed to fetch teams led by the user.";
    if (error instanceof Error) {
      console.error(`Specific error: ${error.message}`);
      // Avoid exposing internal details in production
      // message = process.env.NODE_ENV === 'development' ? error.message : message;
    }
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
