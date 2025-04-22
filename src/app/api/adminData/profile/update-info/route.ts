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

    const { firstname, lastname, contact } = body;
    if (
      firstname === undefined &&
      lastname === undefined &&
      contact === undefined
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
    } = {};
    if (firstname !== undefined) {
      if (typeof firstname !== "string" || firstname.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            message: "Bad Request: First name cannot be empty.",
          },
          { status: 400 }
        );
      }
      updateData.firstname = firstname;
    }
    if (lastname !== undefined) {
      if (typeof lastname !== "string" || lastname.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            message: "Bad Request: Last name cannot be empty.",
          },
          { status: 400 }
        );
      }
      updateData.lastname = lastname;
    }
    if (contact !== undefined) {
      updateData.contact = contact;
    }
    await connectToDatabase();

    const result = await Admin.updateOne(
      { AdminId: userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Admin not found." },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0 && result.matchedCount === 1) {
      return NextResponse.json({
        success: true,
        message: "Profile information is already up to date.",
      });
    }

    const updatedUser = await Admin.findOne(
      { AdminId: userId },
      { password: 0 }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Profile information updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error(" Error updating admin profile ", error);
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
