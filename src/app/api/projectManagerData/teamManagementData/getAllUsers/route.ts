export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
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
    const UserType = await GetUserType(token);
    if (!UserType || UserType != "ProjectManager") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access you are not an Project Manager",
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const users = await User.find({ userType: "User" }).select(
      "firstname lastname email UserId"
    );

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch users.",
      },
      { status: 500 }
    );
  }
}
