import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import { getToken, GetUserId, GetUserType } from "@/utils/token";
import { UpdateTeamSchema } from "@/schemas/teamSchema";
export async function PUT(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }
    const userType = await GetUserType(token);
    if (userType !== "ProjectManager") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access, you are not a Project Manager",
        },
        { status: 401 }
      );
    }
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. User ID not found, please login again.",
        },
        { status: 401 }
      );
    }
    const { teamId } = params;

    const { teamName, teamLeader, members } = await req.json();
    if (!teamId || !teamName || !teamLeader || !members) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }
    console.log(members);
    if (members.length <= 1) {
      return NextResponse.json(
        { success: false, message: "Minimun selection for the Members is 2" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    let teamLeaderids: string[] = [teamLeader.userId];
    const parsedData = UpdateTeamSchema.safeParse({
      teamName,
      teamLeader: teamLeaderids,
      members: members.map((member: { userId: string }) => member.userId),
    });

    if (!parsedData.success) {
      const errorMessages = parsedData.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: errorMessages },
        { status: 400 }
      );
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { teamId, createdBy: userId },
      {
        teamName,
        teamLeader: teamLeader.userId,
        members: members.map((member: { userId: string }) => member.userId),
      },
      { new: true, runValidators: true }
    );

    if (updatedTeam) {
      return NextResponse.json({
        success: true,
        message: "Team updated successfully.",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Team not found or unauthorized." },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update team." },
      { status: 500 }
    );
  }
}
