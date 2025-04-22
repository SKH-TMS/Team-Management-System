export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getToken, GetUserId } from "@/utils/token";
import Admin from "@/models/Admin";

export async function PUT(req: NextRequest) {
  try {
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
          message: "Unauthorized: Invalid token or user ID not found in token.",
        },
        { status: 401 }
      );
    }
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Invalid JSON payload." },
        { status: 400 }
      );
    }
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: Both current and new passwords are required.",
        },
        { status: 400 }
      );
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Bad Request: New password must be a string of at least 6 characters.",
        },
        { status: 400 }
      );
    }
    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Bad Request: New password cannot be the same as the current password.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await Admin.findOne({ AdminId: userId }).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Incorrect current password." },
        { status: 401 }
      );
    }

    user.password = newPassword;
    await user.save();
    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error(
      "❌ Error changing password (/api/profile/change-password PUT):",
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: `Validation Error: ${errorMessage}` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
