import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
  Font,
} from "@react-email/components";
import * as React from "react";

interface PasswordResetEmailProps {
  userName?: string;
  resetPasswordUrl: string;
  appName?: string;
  appLogoUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const PasswordResetEmail = ({
  userName = "Admin",
  resetPasswordUrl,
  appName = "Team Management System",
  appLogoUrl = `${baseUrl}/TMS.png`,
}: PasswordResetEmailProps) => (
  <Html>
    <Head></Head>
    <Preview>Reset your password for {appName}</Preview>
    <Tailwind>
      <Body className="bg-gray-100 text-gray-800 font-sans p-4">
        <Container className="bg-white border border-solid border-gray-200 rounded-lg shadow-sm my-10 mx-auto p-8 max-w-[600px]">
          <Section className="text-center mb-8">
            <Img
              src={"/TMS.png"}
              width="48"
              height="48"
              alt={`${appName} Logo`}
              className="my-0 mx-auto"
            />
          </Section>
          <Heading className="text-gray-900 text-2xl font-semibold text-center p-0 my-6 mx-0">
            Reset Your Password
          </Heading>
          <Text className="text-gray-600 text-base leading-relaxed text-center">
            Hi {userName}, we received a request to reset the password for your{" "}
            {appName} admin account.
          </Text>
          <Text className="text-gray-600 text-base leading-relaxed text-center">
            Click the button below to set a new password:
          </Text>
          <Section className="text-center mt-8 mb-8">
            <Button
              className="bg-red-600 rounded-md text-white text-base font-medium no-underline text-center px-6 py-3 shadow-sm hover:bg-red-700 transition-colors"
              href={resetPasswordUrl}
            >
              Reset Password
            </Button>
          </Section>
          <Text className="text-gray-500 text-sm leading-6 text-center">
            This link is valid for 10 minutes. If you didn't request a password
            reset, please ignore this email or contact support if you have
            concerns.
          </Text>
          <Hr className="border border-solid border-gray-200 my-6 mx-0 w-full" />
          <Text className="text-gray-500 text-xs leading-5 text-center">
            If the button doesn't work, copy and paste this URL into your
            browser:
          </Text>
          <Link
            href={resetPasswordUrl}
            className="text-blue-600 text-xs break-all block text-center hover:underline"
          >
            {resetPasswordUrl}
          </Link>
          <Hr className="border border-solid border-gray-200 my-6 mx-0 w-full" />
          <Text className="text-gray-400 text-xs text-center">
            © {new Date().getFullYear()} {appName}, Inc. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default PasswordResetEmail;
