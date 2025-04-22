export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "@/models/User";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { token: rawToken, newPassword } = body;

    if (!rawToken || typeof rawToken !== "string") {
      return NextResponse.json(
        { success: false, message: "Password reset token is required." },
        { status: 400 }
      );
    }
    if (
      !newPassword ||
      typeof newPassword !== "string" ||
      newPassword.length < 6
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 6 characters long.",
        },
        { status: 400 }
      );
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await connectToDatabase();

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      console.log(
        `Password reset attempt failed: Token invalid or expired. Hashed token checked: ${hashedToken}`
      );
      const expireduser = await User.findOne({
        passwordResetToken: hashedToken,
      });
      if (expireduser) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Password reset token has expired. Please request a new one.",
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { success: false, message: "Invalid password reset token." },
          { status: 400 }
        );
      }
    }

    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return NextResponse.json(
          {
            success: false,
            message: "New password cannot be the same as the old password.",
          },
          { status: 400 }
        );
      }
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.isVerified = true;

    await user.save();

    console.log(`Password reset successfully for user ${user.email}`);

    return NextResponse.json({
      success: true,
      message:
        "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: `Validation Error: ${error.message}` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reset password due to a server error.",
      },
      { status: 500 }
    );
  }
}
