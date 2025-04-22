export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import crypto from "crypto";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const { token: rawToken } = body;

    if (!rawToken || typeof rawToken !== "string") {
      return NextResponse.json(
        { success: false, message: "Verification token is required." },
        { status: 400 }
      );
    }
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await connectToDatabase();
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log(
        `Admin verification attempt failed: Token invalid or expired. Hashed token checked: ${hashedToken}`
      );
      const expiredUser = await User.findOne({
        verificationToken: hashedToken,
      });
      if (expiredUser) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Verification token has expired. Please register again or request a new link.",
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { success: false, message: "Invalid verification token." },
          { status: 400 }
        );
      }
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    console.log(`user ${user.email} verified successfully.`);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("user Email Verification Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Email verification failed due to a server error.",
      },
      { status: 500 }
    );
  }
}
