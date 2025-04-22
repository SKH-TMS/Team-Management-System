"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircleIcon,
  AlertCircleIcon,
  MailWarningIcon,
} from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verifying your email address...");
  const [tokenChecked, setTokenChecked] = useState(false);

  const toastId = useRef("admin-verify-toast");

  useEffect(() => {
    if (tokenChecked) return;
    setTokenChecked(true);

    const token = searchParams.get("token");
    if (!token) {
      setMessage("Invalid verification link. No token found.");
      setStatus("error");
      toast.error("Invalid verification link.", { id: toastId.current });
      return;
    }

    const verifyToken = async () => {
      setStatus("loading");
      setMessage("Verifying your email address...");
      toast.loading("Verifying...", { id: toastId.current });

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage(
            data.message ||
              "Email verified successfully! Redirecting to login..."
          );
          toast.success("Verification successful!", {
            id: toastId.current,
          });
          setTimeout(() => {
            router.push("/adminData/LoginAdmin");
          }, 3500);
        } else {
          throw new Error(data.message || "Verification failed.");
        }
      } catch (err) {
        const error = err as Error;
        console.error("Verification API call error:", error);
        setStatus("error");
        setMessage(error.message || "An error occurred during verification.");
        toast.error(`Verification failed: ${error.message}`, {
          id: toastId.current,
        });
      }
    };

    verifyToken();
  }, [searchParams, router, tokenChecked]);

  let cardContent: React.ReactNode;
  switch (status) {
    case "loading":
      cardContent = (
        <div className="flex flex-col items-center text-center space-y-3 text-blue-700">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-lg font-medium">{message}</p>
        </div>
      );
      break;
    case "success":
      cardContent = (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircleIcon className="h-5 w-5" />
          <AlertTitle className="font-semibold">
            Verification Successful!
          </AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      );
      break;
    case "error":
      cardContent = (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-5 w-5" />
          <AlertTitle className="font-semibold">Verification Failed</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      );
      break;
    default:
      cardContent = null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-gray-200">
        <CardHeader className="text-center">
          {status === "loading" && (
            <MailWarningIcon className="w-12 h-12 mx-auto text-blue-500 mb-3" />
          )}
          {status === "success" && (
            <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-3" />
          )}
          {status === "error" && (
            <AlertCircleIcon className="w-12 h-12 mx-auto text-red-500 mb-3" />
          )}
          <CardTitle className="text-2xl font-bold text-gray-800">
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">{cardContent}</CardContent>
        {(status === "success" || status === "error") && (
          <CardFooter className="flex justify-center pt-4 pb-6 border-t">
            <Button variant="link" asChild className="text-sm font-medium">
              <Link href="/adminData/LoginAdmin">Go to Admin Login</Link>
            </Button>
            {status === "error" && (
              <Button variant="link" asChild className="text-sm font-medium">
                <Link href="/adminData/LoginAdmin">Request New Link</Link>
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading Verification...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
