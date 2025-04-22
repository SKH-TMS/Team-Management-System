"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { AuthContext } from "@/context/AuthContext";
import {
  adminLoginSchema,
  AdminLoginFormData,
} from "@/schemas/frontend/adminSchema";

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
import { LogInIcon } from "lucide-react";

export default function LoginAdmin() {
  const { refreshAuth } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: AdminLoginFormData) {
    setLoading(true);
    setApiError(null);
    const loadingToastId = toast.loading("Logging in...");

    try {
      const response = await fetch("/api/adminData/login_admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          email: values.email.toLowerCase().trim(),
          password: values.password,
        }),
      });

      const data = await response.json();
      toast.dismiss(loadingToastId);

      if (data.success) {
        await refreshAuth();
        toast.success("Admin Login successful!");
        router.push("/adminData/Management/ProfileAdmin");
      } else {
        const errorMessage =
          data.message || "Login failed. Please check credentials.";
        setApiError(errorMessage);
        if (
          data.action === "resent_verification" ||
          data.action === "needs_verification"
        ) {
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      console.error("Login Submit Error:", error);
      const message = "An error occurred during login. Please try again.";
      setApiError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">
              Admin Login
            </h2>

            {apiError && (
              <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded border border-red-200">
                {apiError}
              </p>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              <LogInIcon className="w-4 h-4 mr-2" />
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="text-sm text-center mt-4 space-y-2">
              <Button
                variant="link"
                asChild
                className="p-0 h-auto font-medium text-xs"
              >
                <Link href="/adminData/ForgotPasswordAdmin">
                  Forgot your password?
                </Link>
              </Button>
              <p className="text-gray-600">
                Need an admin account?{" "}
                <Button
                  variant="link"
                  asChild
                  className="p-0 h-auto font-medium"
                >
                  <Link href="/adminData/RegisterAdmin">Register here</Link>
                </Button>
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
