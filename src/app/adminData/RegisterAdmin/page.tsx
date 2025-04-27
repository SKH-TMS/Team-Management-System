"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import {
  adminRegisterSchema,
  AdminRegisterFormData,
} from "@/schemas/frontend/adminSchema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { UserPlusIcon } from "lucide-react";

export default function RegisterAdmin() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<AdminRegisterFormData>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      confirmPassword: "",
      contact: "",
    },
  });

  async function onSubmit(values: AdminRegisterFormData) {
    setIsSubmitting(true);
    setApiError(null);
    const loadingToastId = toast.loading("Registering admin...");

    try {
      const response = await fetch("/api/adminData/register_admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: values.firstname,
          lastname: values.lastname,
          email: values.email.toLowerCase().trim(),
          password: values.password,
          contact: values.contact || "",
        }),
      });

      const result = await response.json();
      toast.dismiss(loadingToastId);

      if (response.ok && result.success) {
        toast.success(
          result.message || "Registration successful! Check email."
        );
        router.push(
          `/adminData/VerificationEmailSent?email=${encodeURIComponent(values.email.toLowerCase().trim())}`
        );
      } else {
        const errorMessage = result.message || "Registration failed.";
        setApiError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      console.error("Registration Submit Error:", error);
      const message =
        "An error occurred during registration. Please try again.";
      setApiError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">
                Create Admin Account
              </h2>
              <p className="text-center text-sm text-gray-500 mb-6">
                Register a new administrator account.
              </p>

              {apiError && (
                <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded border border-red-200">
                  {apiError}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email Address <span className="text-red-500">*</span>
                    </FormLabel>
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
                    <FormLabel>
                      Password <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Must be at least 6 characters.
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
                    <FormLabel>
                      Confirm Password <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Enter contact number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <UserPlusIcon className="w-5 h-5 mr-2 -ml-1" />
                {isSubmitting ? "Registering..." : "Register Admin"}
              </Button>

              <div className="text-center text-sm mt-6">
                Already have an admin account?{" "}
                <Button
                  variant="link"
                  asChild
                  className="p-0 h-auto font-medium"
                >
                  <Link href="/adminData/LoginAdmin">Login here</Link>
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
