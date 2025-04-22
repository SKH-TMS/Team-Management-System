"use client";

import React, { useState, useEffect, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  ArrowLeftIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  Loader2,
} from "lucide-react";
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
//TODO:Remove Hero and use Lucid

const userResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long." })
      .max(50, { message: "Password too long (max 50)." }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your new password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type userResetPasswordFormData = z.infer<typeof userResetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const form = useForm<userResetPasswordFormData>({
    resolver: zodResolver(userResetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!token) {
      const msg = "Invalid or missing password reset link.";
      setTokenError(msg);
      toast.error(msg);
    }
  }, [token, router]);

  const onSubmit = async (values: userResetPasswordFormData) => {
    setApiMessage(null);
    setIsSuccess(false);
    if (!token) {
      setApiMessage("Password reset token is missing.");
      return;
    }

    setLoading(true);
    const loadingToastId = toast.loading("Resetting password...");
    try {
      const response = await fetch("/api/userData/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: values.newPassword }),
      });
      const data = await response.json();
      toast.dismiss(loadingToastId);
      if (data.success) {
        setApiMessage(data.message || "Password reset successfully!");
        setIsSuccess(true);
        toast.success("Password reset successfully!");
        form.reset();
        setTimeout(() => {
          router.push("/userData/LoginUser");
        }, 3000);
      } else {
        throw new Error(data.message || "Failed to reset password.");
      }
    } catch (err) {
      toast.dismiss(loadingToastId);
      const error = err as Error;
      console.error("Reset Password Submit Error:", error);
      setApiMessage(error.message);
      setIsSuccess(false);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <Card className="w-full max-w-md shadow-lg text-center p-6">
          <CardHeader>
            {" "}
            <CardTitle className="text-xl font-bold text-destructive mb-4">
              Invalid Link
            </CardTitle>{" "}
          </CardHeader>
          <CardContent>
            {" "}
            <p className="text-muted-foreground mb-4">{tokenError}</p>{" "}
            <Button variant="link" asChild>
              {" "}
              <Link href="/userData/ForgotPasswordUser">
                Request a new link
              </Link>{" "}
            </Button>{" "}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-indigo-100 p-4">
      <Card className="w-full max-w-lg shadow-xl border-gray-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
            {" "}
            Reset user Password{" "}
          </CardTitle>

          {!apiMessage && (
            <CardDescription className="text-base text-gray-600 pt-2">
              {" "}
              Enter and confirm your new password below.{" "}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-6 pt-2">
          {apiMessage && (
            <Alert
              variant={isSuccess ? "default" : "destructive"}
              className={`mb-6 ${isSuccess ? "bg-green-50 border-green-200" : ""}`}
            >
              {isSuccess ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <AlertCircleIcon className="h-5 w-5" />
              )}
              <AlertTitle>{isSuccess ? "Success!" : "Error"}</AlertTitle>
              <AlertDescription> {apiMessage} </AlertDescription>
            </Alert>
          )}

          {!isSuccess && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:bg-slate-100" />
                          <Input
                            type={newPasswordVisible ? "text" : "password"}
                            placeholder="******"
                            {...field}
                            className="pl-9 pr-10 h-11"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setNewPasswordVisible(!newPasswordVisible)
                            }
                            className="absolute inset-y-0 right-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground hover:bg-white"
                            aria-label={
                              newPasswordVisible
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {newPasswordVisible ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        {" "}
                        Must be at least 6 characters long.{" "}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:bg-slate-100" />
                          <Input
                            type={confirmPasswordVisible ? "text" : "password"}
                            placeholder="******"
                            {...field}
                            className="pl-9 pr-10 h-11"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setConfirmPasswordVisible(!confirmPasswordVisible)
                            }
                            className="absolute inset-y-0 right-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground hover:bg-white"
                            aria-label={
                              confirmPasswordVisible
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {confirmPasswordVisible ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-base"
                  disabled={loading || !token}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center pt-6 pb-6 border-t">
          <Button variant="link" asChild className="text-sm font-medium">
            <Link href="/userData/LoginUser">
              <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="flex justify-center items-center min-h-screen">
            Loading...
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
