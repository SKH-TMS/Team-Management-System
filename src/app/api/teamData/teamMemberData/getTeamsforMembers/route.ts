export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";
import { getToken, GetUserId, GetUserRole } from "@/utils/token";

export async function GET(req: NextRequest) {
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
    if (userrole && userrole.includes("TeamMember")) {
      isverified = true;
    }
    if (!isverified) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a TeamMember.",
        },
        { status: 401 }
      );
    }
    const userid = await GetUserId(token);

    await connectToDatabase();

    const userTeams = await Team.find({ members: userid });

    const teamMembersData = await Promise.all(
      userTeams.map(async (team) => {
        const members = await User.find({ UserId: { $in: team.members } });
        return {
          teamId: team.teamId,
          members: members.map((member) => ({
            UserId: member.UserId,
            firstname: member.firstname,
            lastname: member.lastname,
            profilepic: member.profilepic,
            email: member.email,
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      teams: userTeams,
      membersData: teamMembersData,
    });
  } catch (error) {
    console.error("Error fetching teams for member:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch teams for member." },
      { status: 500 }
    );
  }
}
