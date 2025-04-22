export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { generatePasswordResetToken } from "@/utils/tokenUtils";
import { sendPasswordResetEmail } from "@/utils/emailSender";

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

    const admin = await Admin.findOne({ email: lowerCaseEmail });

    if (!admin) {
      console.log(
        `Password reset requested for non-existent admin email: ${lowerCaseEmail}`
      );
      return NextResponse.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const { rawToken, hashedToken, expiryDate } = generatePasswordResetToken();

    admin.passwordResetToken = hashedToken;
    admin.passwordResetTokenExpires = expiryDate;
    await admin.save();
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/adminData/ResetPassword?token=${rawToken}`;

      await sendPasswordResetEmail({
        recipientName: admin.firstname,
        recipientEmail: admin.email,
        resetUrl: resetUrl,
      });
    } catch (emailError) {
      console.error(
        `Failed to send password reset email to ${admin.email}:`,
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
