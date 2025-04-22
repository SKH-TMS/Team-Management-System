"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MailOpen, ClockIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const REDIRECT_DELAY_SECONDS = 10;

function VerificationSentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_SECONDS);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        const nextVal = prev > 0 ? prev - 1 : 0;
        setProgress((nextVal / REDIRECT_DELAY_SECONDS) * 100);
        return nextVal;
      });
    }, 1000);

    const redirectTimer = setTimeout(() => {
      router.push("/adminData/LoginAdmin");
    }, REDIRECT_DELAY_SECONDS * 1000);
    return () => {
      clearInterval(countInterval);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-lg shadow-xl border-gray-200 text-center">
        <CardHeader className="pt-8">
          {" "}
          <MailOpen className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <CardTitle className="text-2xl md:text-3xl font-bold text-gray-800">
            Verification Email Sent!
          </CardTitle>
          <CardDescription className="text-base text-gray-600 pt-2">
            We've sent a verification link to:
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {" "}
          {email ? (
            <p className="font-semibold text-lg text-indigo-700 mb-6 break-words">
              {decodeURIComponent(email)}
            </p>
          ) : (
            <p className="font-semibold text-lg text-indigo-700 mb-6">
              your registered email address.
            </p>
          )}
          <p className="text-base text-gray-600 mb-8">
            verification link has been sent to the Suppert email address. Please
            ask Support to check and verify you
          </p>
          <div className="space-y-2">
            <Progress value={progress} className="w-full h-2" />{" "}
            <p className="text-sm text-gray-500 flex items-center justify-center">
              <ClockIcon className="w-4 h-4 mr-1.5" />
              Redirecting to login in {countdown} seconds...
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pb-8">
          <Button variant="link" asChild>
            <Link href="/adminData/LoginAdmin">Go to Login Now</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerificationEmailSentPage() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="flex items-center justify-center min-h-screen">
            Loading...
          </div>
        </div>
      }
    >
      <VerificationSentContent />
    </Suspense>
  );
}
