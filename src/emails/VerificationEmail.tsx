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

interface VerificationEmailProps {
  userName?: string;
  verificationUrl: string;
  appName?: string;
  appLogoUrl?: string;
}
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const VerificationEmail = ({
  userName = "Admin",
  verificationUrl,
  appName = "Team Management System",
  appLogoUrl = `${baseUrl}/logo.png`,
}: VerificationEmailProps) => (
  <Html>
    <Head></Head>
    <Preview>Confirm New Admin Request {appName}</Preview>
    <Tailwind>
      <Body className="bg-gray-100 text-gray-800 font-sans p-4">
        <Container className="bg-white border border-solid border-gray-200 rounded-lg shadow-sm my-10 mx-auto p-8 max-w-[600px]">
          <Section className="text-center mb-8">
            <Img
              src={appLogoUrl}
              width="48"
              height="48"
              alt={`${appName} Logo`}
              className="my-0 mx-auto"
            />
          </Section>

          <Heading className="text-gray-900 text-2xl font-semibold text-center p-0 my-6 mx-0">
            Name: {userName}!
          </Heading>

          <Text className="text-gray-600 text-base leading-relaxed text-center">
            Please click the button below to verify email address of Admin and
            activate new Admin Account.
          </Text>
          <Section className="text-center mt-8 mb-8">
            <Button
              className="bg-blue-600 rounded-md text-white text-base font-medium no-underline text-center px-6 py-3 shadow-sm hover:bg-blue-700 transition-colors"
              href={verificationUrl}
            >
              Verify Admin Email Address
            </Button>
          </Section>
          <Text className="text-gray-500 text-sm leading-6 text-center">
            This verification link is valid for 1 hour.
          </Text>
          <Hr className="border border-solid border-gray-200 my-6 mx-0 w-full" />
          <Text className="text-gray-500 text-xs leading-5 text-center">
            If the button above doesn't work, copy and paste this URL into your
            browser:
          </Text>
          <Link
            href={verificationUrl}
            className="text-blue-600 text-xs break-all block text-center hover:underline"
          >
            {verificationUrl}
          </Link>
          <Hr className="border border-solid border-gray-200 my-6 mx-0 w-full" />
          <Text className="text-gray-400 text-xs text-center">
            You received this email because a New User has signed up for
            {appName}. If you didn't request this, please ignore this email.
          </Text>
          <Text className="text-gray-400 text-xs text-center mt-2">
            © {new Date().getFullYear()} {appName}, Inc. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default VerificationEmail;
