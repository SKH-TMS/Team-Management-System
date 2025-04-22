"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { AuthContext } from "@/context/AuthContext";
import {
  userLoginSchema,
  userLoginFormData,
} from "@/schemas/frontend/userSchema";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { LogInIcon, Loader2, AlertCircle } from "lucide-react";

export default function LoginUser() {
  const { refreshAuth } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<userLoginFormData>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: userLoginFormData) {
    setLoading(true);
    setApiError(null);
    const loadingToastId = toast.loading("Logging in...");

    try {
      const response = await fetch("/api/userData/login_user", {
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

        if (data?.user) {
          if (data.user.userRoles) {
            toast.success("Welcome Participent");
            router.push("/teamData/ProfileTeam");
          } else {
            toast.success("Login successful!");
            router.push("/userData/ProfileUser");
          }
        } else if (data?.ProjectManager) {
          toast.success("Project Manager Login successful!");
          router.push("/projectManagerData/ProfileProjectManager");
        } else {
          toast.error(
            "Login successful, but user type unclear. Redirecting to default profile."
          );
          console.warn("Unknown response structure on successful login:", data);
          router.push("/userData/ProfileUser");
        }
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
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            User Login
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 pt-1">
            Access your Team Management dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {apiError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
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
                        placeholder="you@example.com"
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
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center pt-6 border-t">
          <Button
            variant="link"
            asChild
            className="text-sm font-medium p-0 h-auto mb-2"
          >
            <Link href="/userData/ForgotPasswordUser">
              Forgot your password?
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto font-medium">
              <Link href="/userData/RegisterUser">Register here</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
