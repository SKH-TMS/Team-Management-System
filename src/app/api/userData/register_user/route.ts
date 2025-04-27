import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { userRegistrationSchema } from "@/schemas/userSchema";
import { generateVerificationToken } from "@/utils/tokenUtils";
import { sendUserVerificationEmail } from "@/utils/emailSender";
export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.error(
      "Email sending is not configured. RESEND_API_KEY or EMAIL_FROM missing."
    );
  }
  try {
    const { firstname, lastname, email, password, contact } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Email and password are required",
        },
        {
          status: 401,
        }
      );
    }

    const parsedData = userRegistrationSchema.safeParse({
      firstname,
      lastname,
      email,
      password,
      contact,
    });
    if (!parsedData.success) {
      const errorMessages = parsedData.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json({ error: errorMessages }, { status: 400 });
    }

    await connectToDatabase();

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: "Email is already registered",
            message: "Email is already registered",
          },
          { status: 402 }
        );
      }
    } catch (error) {
      console.error("Error while finding user:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to find user",
          message: "Email is already registered",
        },
        { status: 500 }
      );
    }
    const { rawToken, hashedToken, expiryDate } = generateVerificationToken(); // Default expiry is 1 hour
    const newUser = new User({
      firstname,
      lastname,
      email,
      password,
      contact: contact || "",
      profilepic: "/default-profile.png",
      userType: "User",
      verificationToken: hashedToken,
      verificationTokenExpires: expiryDate,
    });

    await newUser.save();
    console.log(
      `User ${newUser.email} created with ID ${newUser.UserId}, awaiting verification.`
    );
    if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      try {
        const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/userData/verify-email?token=${rawToken}`; // Use RAW token in link

        await sendUserVerificationEmail({
          recipientName: newUser.firstname,
          recipientEmail: newUser.email,
          verificationUrl: verificationUrl,
        });
        console.log(
          `Verification email sending initiated for ${newUser.email}.`
        );
      } catch (emailError) {
        console.error(
          `Failed to send verification email to ${newUser.email} after registration:`,
          emailError
        );
      }
    } else {
      console.warn(
        `Skipping verification email for ${newUser.email} due to missing configuration.`
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "User registration successful! Please check your email to verify your account.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("User Registration error:", error);
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
          message: "A user with this email or ID already exists.",
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
