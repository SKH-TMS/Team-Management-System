import { Resend } from "resend";
import VerificationEmail from "@/emails/VerificationEmail";
import VerificationUserEmail from "@/emails/VerificationEmail";
import PasswordResetEmail from "@/emails/PasswordResetEmail";
import PasswordResetUserEmail from "@/emails/PasswordResetEmail";
import * as React from "react";

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.warn(
    "RESEND_API_KEY environment variable is not set. Email sending will be disabled."
  );
}
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const fromEmail = process.env.EMAIL_FROM;
if (!fromEmail) {
  console.warn(
    "EMAIL_FROM environment variable is not set. Please set a verified sender email."
  );
}

interface SendVerificationEmailOptions {
  recipientName: string;
  recipientEmail: string;
  verificationUrl: string;
}

/**
 * Sends the verification email using Resend and a React Email template.
 * @param {SendVerificationEmailOptions} options - Details for sending the email.
 */
export const sendAdminVerificationEmail = async ({
  recipientName,
  recipientEmail,
  verificationUrl,
}: SendVerificationEmailOptions): Promise<void> => {
  if (!resend || !fromEmail) {
    console.error(
      "Resend client or 'From' email is not configured. Cannot send email."
    );

    throw new Error("Email service is not configured properly.");
  }

  try {
    console.log(
      `Attempting to send verification email to ${recipientEmail} from ${fromEmail}`
    );

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: "Verify New Admin Account",

      react: React.createElement(VerificationEmail, {
        userName: recipientName,
        verificationUrl: verificationUrl,
      }),
    });

    if (error) {
      console.error(`Resend Error sending email to ${recipientEmail}:`, error);

      throw new Error(
        `Failed to send verification email: ${error.message || "Unknown Resend error"}`
      );
    }

    console.log(
      `Verification email sent successfully to ${recipientEmail}. Resend ID: ${data?.id}`
    );
  } catch (error) {
    console.error(
      `Error in sendAdminVerificationEmail function for ${recipientEmail}:`,
      error
    );

    throw error;
  }
};
// now for the user
export const sendUserVerificationEmail = async ({
  recipientName,
  recipientEmail,
  verificationUrl,
}: SendVerificationEmailOptions): Promise<void> => {
  if (!resend || !fromEmail) {
    console.error(
      "Resend client or 'From' email is not configured. Cannot send email."
    );

    throw new Error("Email service is not configured properly.");
  }

  try {
    console.log(
      `Attempting to send verification email to ${recipientEmail} from ${fromEmail}`
    );

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: "Verify Your User Account",

      react: React.createElement(VerificationUserEmail, {
        userName: recipientName,
        verificationUrl: verificationUrl,
      }),
    });

    if (error) {
      console.error(`Resend Error sending email to ${recipientEmail}:`, error);

      throw new Error(
        `Failed to send verification email: ${error.message || "Unknown Resend error"}`
      );
    }

    console.log(
      `Verification email sent successfully to ${recipientEmail}. Resend ID: ${data?.id}`
    );
  } catch (error) {
    console.error(
      `Error in sendAdminVerificationEmail function for ${recipientEmail}:`,
      error
    );

    throw error;
  }
};

interface SendPasswordResetEmailOptions {
  recipientName: string;
  recipientEmail: string;
  resetUrl: string;
}

export const sendPasswordResetEmail = async ({
  recipientName,
  recipientEmail,
  resetUrl,
}: SendPasswordResetEmailOptions): Promise<void> => {
  if (!resend || !fromEmail) {
    throw new Error("Email service is not configured properly.");
  }

  try {
    console.log(`Attempting to send password reset email to ${recipientEmail}`);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: "Reset Your Admin Password",
      react: React.createElement(PasswordResetEmail, {
        userName: recipientName,
        resetPasswordUrl: resetUrl,
      }),
    });

    if (error) {
      console.error(
        `Resend Error sending password reset to ${recipientEmail}:`,
        error
      );
      throw new Error(
        `Failed to send password reset email: ${error.message || "Unknown Resend error"}`
      );
    }
    console.log(
      `Password reset email sent successfully to ${recipientEmail}. Resend ID: ${data?.id}`
    );
  } catch (error) {
    console.error(
      `Error in sendPasswordResetEmail function for ${recipientEmail}:`,
      error
    );
    throw error;
  }
};
//For user now
export const sendPasswordResetUserEmail = async ({
  recipientName,
  recipientEmail,
  resetUrl,
}: SendPasswordResetEmailOptions): Promise<void> => {
  if (!resend || !fromEmail) {
    throw new Error("Email service is not configured properly.");
  }

  try {
    console.log(`Attempting to send password reset email to ${recipientEmail}`);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: "Reset Your User account Password",
      react: React.createElement(PasswordResetUserEmail, {
        userName: recipientName,
        resetPasswordUrl: resetUrl,
      }),
    });

    if (error) {
      console.error(
        `Resend Error sending password reset to ${recipientEmail}:`,
        error
      );
      throw new Error(
        `Failed to send password reset email: ${error.message || "Unknown Resend error"}`
      );
    }
    console.log(
      `Password reset email sent successfully to ${recipientEmail}. Resend ID: ${data?.id}`
    );
  } catch (error) {
    console.error(
      `Error in sendPasswordResetEmail function for ${recipientEmail}:`,
      error
    );
    throw error;
  }
};
