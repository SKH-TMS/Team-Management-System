import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { adminRegisterSchema } from "@/schemas/adminSchema";
import { generateVerificationToken } from "@/utils/tokenUtils";
import { sendAdminVerificationEmail } from "@/utils/emailSender";

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.error("Email sending is not configured.");
  }

  try {
    const body = await req.json();

    const parsedData = adminRegisterSchema.safeParse(body);
    if (!parsedData.success) {
      const errorMessages = parsedData.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: `Validation Error: ${errorMessages}` },
        { status: 400 }
      );
    }
    const { firstname, lastname, email, password, contact } = parsedData.data;

    await connectToDatabase();

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, message: "Email is already registered." },
        { status: 409 }
      );
    }

    const { rawToken, hashedToken, expiryDate } = generateVerificationToken();
    const newAdmin = new Admin({
      firstname,
      lastname,
      email,
      password,
      contact: contact || "",
      profilepic: "/default-profile.png",
      userType: "Admin",
      verificationToken: hashedToken,
      verificationTokenExpires: expiryDate,
    });

    await newAdmin.save();
    console.log(
      `Admin ${newAdmin.email} created with ID ${newAdmin.id}, awaiting verification.`
    );
    if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      try {
        const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/adminData/verify-email?token=${rawToken}`; // Use RAW token in link

        await sendAdminVerificationEmail({
          recipientName: newAdmin.firstname + "-- Email:" + newAdmin.email,
          // recipientEmail: newAdmin.email,
          recipientEmail: "k.s.h.taskmanagement@gmail.com",
          verificationUrl: verificationUrl,
        });
        console.log(
          `Verification email sending initiated for ${newAdmin.email}.`
        );
      } catch (emailError) {
        console.error(
          `Failed to send verification email to ${newAdmin.email} after registration:`,
          emailError
        );
      }
    } else {
      console.warn(
        `Skipping verification email for ${newAdmin.email} due to missing configuration.`
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Admin registration successful! Please ask support to check their email to verify your account.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin Registration error:", error);
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: `Validation Error: ${error.message}` },
        { status: 400 }
      );
    }
    if (error instanceof Error && (error as any).code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin with this email or ID already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to register admin." },
      { status: 500 }
    );
  }
}
