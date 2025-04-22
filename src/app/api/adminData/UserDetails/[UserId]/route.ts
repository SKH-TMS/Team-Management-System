import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getToken, GetUserType } from "@/utils/token";

export async function GET(
  req: NextRequest,
  { params }: { params: { UserId: string } }
) {
  try {
    const targetUserId = params.UserId;

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
        { success: false, message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    if (!targetUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: User ID parameter is missing.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne(
      { UserId: targetUserId },
      { password: 0 }
    ).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: user });
  } catch (error) {
    console.error(
      `❌ Error fetching user details for ${params?.UserId}:`,
      error
    );
    let errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    if (error instanceof Error && error.name === "CastError") {
      errorMessage = `Invalid User ID format provided.`;
      return NextResponse.json(
        { success: false, message: `Bad Request: ${errorMessage}` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
