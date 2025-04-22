"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EnvelopeIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
//TODO: Removing hero and use lucid
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Invalid email address." }),
});
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordUser() {
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormData) => {
    setApiMessage("");
    setIsSuccess(false);
    setLoading(true);
    const loadingToastId = toast.loading("Sending reset link...");

    try {
      const response = await fetch("/api/userData/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email.toLowerCase().trim() }),
      });

      const data = await response.json();
      toast.dismiss(loadingToastId);

      setApiMessage(data.message || "An unexpected error occurred.");

      if (data.success) {
        setIsSuccess(true);
        toast.success("Password reset instructions sent (if account exists).");
        form.reset();
      } else {
        setIsSuccess(false);
        toast.error(data.message || "Failed to send reset link.");
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      console.error("Forgot Password Submit Error:", error);
      const errorMsg = "An error occurred. Please try again later.";
      setApiMessage(errorMsg);
      setIsSuccess(false);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Forgot User Password
          </CardTitle>
          <CardDescription className="text-center text-sm text-gray-600 pt-1">
            Enter your email to receive a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {apiMessage && (
                <div
                  className={`flex items-center gap-2 text-sm p-3 rounded-md border ${isSuccess ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}
                >
                  {isSuccess && (
                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span>{apiMessage}</span>
                </div>
              )}

              {!isSuccess && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registered Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <EnvelopeIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            {...field}
                            className="pl-9"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!isSuccess && (
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center pt-6 border-t">
          <Button variant="link" asChild className="text-sm font-medium">
            <Link href="/userData/LoginUser">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
