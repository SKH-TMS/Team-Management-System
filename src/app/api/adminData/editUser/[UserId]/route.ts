import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getToken, GetUserType } from "@/utils/token";
import bcrypt from "bcryptjs";

export async function GET(
  req: NextRequest,
  { params }: { params: { UserId: string } }
) {
  try {
    const targetUserId = params.UserId;

    const token = await getToken(req);
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    const requesterUserType = await GetUserType(token);
    if (requesterUserType !== "Admin")
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    if (!targetUserId)
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: User ID parameter is missing.",
        },
        { status: 400 }
      );

    await connectToDatabase();

    const user = await User.findOne(
      { UserId: targetUserId },
      { password: 0 }
    ).lean();
    if (!user)
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );

    return NextResponse.json({ success: true, user: user });
  } catch (error) {
    console.error(
      `❌ Error fetching user profile for ${params?.UserId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, message: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { UserId: string } }
) {
  try {
    const targetUserId = params.UserId;

    const token = await getToken(req);
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    const requesterUserType = await GetUserType(token);
    if (requesterUserType !== "Admin")
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    if (!targetUserId)
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: User ID parameter is missing.",
        },
        { status: 400 }
      );

    const body = await req.json();
    const { firstname, lastname, contact, password } = body;

    if (
      firstname === undefined &&
      lastname === undefined &&
      contact === undefined &&
      password === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: No fields provided for update.",
        },
        { status: 400 }
      );
    }

    const updateData: {
      firstname?: string;
      lastname?: string;
      contact?: string;
      password?: string;
    } = {};

    if (firstname !== undefined) updateData.firstname = firstname;
    if (lastname !== undefined) updateData.lastname = lastname;
    if (contact !== undefined) updateData.contact = contact;

    if (password && typeof password === "string" && password.trim() !== "") {
      try {
        console.log(`Hashing new password for user ${targetUserId}...`);
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
        console.log(`Password hashed successfully for user ${targetUserId}.`);
      } catch (hashError) {
        console.error(
          `Error hashing password for user ${targetUserId}:`,
          hashError
        );
        return NextResponse.json(
          { success: false, message: `Server error: Failed to hash password.` },
          { status: 500 }
        );
      }
    } else if (password !== undefined) {
      console.log(
        `Password field present but empty/invalid for user ${targetUserId}. Password not updated.`
      );
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: No valid fields provided for update.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    console.log(
      `Attempting to update user ${targetUserId} with fields:`,
      Object.keys(updateData)
    );
    const result = await User.updateOne(
      { UserId: targetUserId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    const updatedUser = await User.findOne(
      { UserId: targetUserId },
      { password: 0 }
    ).lean();
    return NextResponse.json({
      success: true,
      message: `User ${targetUserId}'s profile updated successfully.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      `❌ Error updating user profile for ${params?.UserId}:`,
      error
    );
    if (error instanceof SyntaxError)
      return NextResponse.json(
        { success: false, message: "Bad Request: Invalid JSON payload." },
        { status: 400 }
      );
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, message: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
