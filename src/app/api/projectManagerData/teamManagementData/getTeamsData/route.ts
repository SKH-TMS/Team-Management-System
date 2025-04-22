export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Team from "@/models/Team";
import User from "@/models/User";
import { getToken, GetUserId, GetUserType } from "@/utils/token";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }

    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. User ID not found." },
        { status: 401 }
      );
    }

    const userType = await GetUserType(token);
    if (!userType || userType !== "ProjectManager") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access. You are not a Project Manager.",
        },
        { status: 401 }
      );
    }

    const userTeams = await Team.find({ createdBy: userId });

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

    const teamLeadersData = await Promise.all(
      userTeams.map(async (team) => {
        const leaders = await User.find({ UserId: { $in: team.teamLeader } });
        return {
          teamId: team.teamId,
          teamLeaders: leaders.map((leader) => ({
            UserId: leader.UserId,
            firstname: leader.firstname,
            lastname: leader.lastname,
            profilepic: leader.profilepic,
            email: leader.email,
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      teams: userTeams,
      membersData: teamMembersData,
      teamLeadersData: teamLeadersData,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch teams." },
      { status: 500 }
    );
  }
}
