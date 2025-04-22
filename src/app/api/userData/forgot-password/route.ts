export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { generatePasswordResetToken } from "@/utils/tokenUtils";
import { sendPasswordResetUserEmail } from "@/utils/emailSender";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }
    const lowerCaseEmail = email.toLowerCase();

    await connectToDatabase();

    const user = await User.findOne({ email: lowerCaseEmail });

    if (!user) {
      console.log(
        `Password reset requested for non-existent user email: ${lowerCaseEmail}`
      );
      return NextResponse.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const { rawToken, hashedToken, expiryDate } = generatePasswordResetToken();

    user.passwordResetToken = hashedToken;
    user.passwordResetTokenExpires = expiryDate;
    await user.save();
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/userData/ResetPassword?token=${rawToken}`;

      await sendPasswordResetUserEmail({
        recipientName: user.firstname,
        recipientEmail: user.email,
        resetUrl: resetUrl,
      });
    } catch (emailError) {
      console.error(
        `Failed to send password reset email to ${user.email}:`,
        emailError
      );
    }
    return NextResponse.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
