import { NextResponse, NextRequest } from "next/server";
import { generateToken, setToken } from "@/utils/token";
import Admin from "@/models/Admin";
import { connectToDatabase } from "@/lib/mongodb";
import { adminLoginSchema } from "@/schemas/adminSchema";
import { generateVerificationToken } from "@/utils/tokenUtils";
import { sendAdminVerificationEmail } from "@/utils/emailSender";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsedData = adminLoginSchema.safeParse(body);
    if (!parsedData.success) {
      const errorMessages = parsedData.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: errorMessages },
        { status: 400 }
      );
    }
    const { email, password } = parsedData.data;

    await connectToDatabase();

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select(
      "+password +isVerified +verificationToken +verificationTokenExpires"
    );

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!admin.isVerified) {
      console.log(`Login attempt by unverified admin: ${admin.email}`);

      const now = new Date();
      if (
        !admin.verificationToken ||
        !admin.verificationTokenExpires ||
        admin.verificationTokenExpires <= now
      ) {
        console.log(
          `Verification token expired or missing for ${admin.email}. Generating new one.`
        );
        // Generate a NEW token
        const { rawToken, hashedToken, expiryDate } =
          generateVerificationToken();
        admin.verificationToken = hashedToken;
        admin.verificationTokenExpires = expiryDate;
        await admin.save();

        try {
          if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
            const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/adminData/verify-email?token=${rawToken}`;
            await sendAdminVerificationEmail({
              recipientName: admin.firstname + "-- Email:" + admin.email,
              //recipientEmail: admin.email,
              recipientEmail: "k.s.h.taskmanagement@gmail.com",
              verificationUrl: verificationUrl,
            });
            console.log(`New verification email sent to ${admin.email}.`);

            return NextResponse.json(
              {
                success: false,
                message:
                  "Your email is not verified. A new verification link has been sent to the Suppert email address. Please ask Support to check and verify you.",
                action: "resent_verification",
              },
              { status: 403 }
            );
          } else {
            console.error(
              "Cannot resend verification email: Email service not configured."
            );

            return NextResponse.json(
              {
                success: false,
                message:
                  "Your email is not verified, and the verification link may have expired. Please contact support.",
              },
              { status: 403 }
            );
          }
        } catch (emailError) {
          console.error(
            `Failed to resend verification email to ${admin.email}:`,
            emailError
          );

          return NextResponse.json(
            {
              success: false,
              message:
                "Your email is not verified. There was an issue resending the verification link. Please try again later or contact support.",
            },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            message:
              "Your email address is not verified. Please check your inbox (and spam folder) for the verification link.",
            action: "needs_verification",
          },
          { status: 403 }
        );
      }
      ``;
    }
    const profilepic = admin.profilepic || "/default-profile.png";
    const loginTokenPayload = {
      UserId: admin.AdminId,
      adminId: admin.id,
      email: admin.email,
      firstname: admin.firstname,
      lastname: admin.lastname,
      userType: "Admin",
    };
    const loginToken = generateToken(loginTokenPayload);

    const res = NextResponse.json({
      success: true,
      message: "Login successful!",
      user: {
        email: admin.email,
        firstname: admin.firstname,
        lastname: admin.lastname,
        profilepic: profilepic,
        userType: admin.userType,
      },
    });

    setToken(res, loginToken);

    return res;
  } catch (error) {
    console.error("Admin Login error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during login." },
      { status: 500 }
    );
  }
}
