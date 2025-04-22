"use client";

import type React from "react";

import { useState, useEffect, type FormEvent, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

import {
  User,
  Mail,
  Phone,
  ArrowLeft,
  FileText,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Shield,
  AlertCircle,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileFormData {
  firstname: string;
  lastname: string;
  contact: string;
  newPassword?: string;
}

interface UserProfileData {
  UserId: string;
  email: string;
  firstname: string;
  lastname: string;
  contact?: string;
  profilepic: string;
  userType: string;
}

function EditUserProfileContent() {
  const router = useRouter();
  const params = useParams();
  const UserIdParam = params?.UserId;
  const targetUserId = Array.isArray(UserIdParam)
    ? UserIdParam[0]
    : UserIdParam;

  const [formData, setFormData] = useState<ProfileFormData>({
    firstname: "",
    lastname: "",
    contact: "",
    newPassword: "",
  });
  const [currentUserData, setCurrentUserData] =
    useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newPasswordVisible, setNewPasswordVisible] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    if (!targetUserId) {
      setError("User ID not found in URL.");
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/adminData/editUser/${encodeURIComponent(targetUserId as string)}`
        );
        if (!response.ok) {
          let errorMsg = "Failed to fetch user data.";
          if (response.status === 401 || response.status === 403) {
            errorMsg = "Unauthorized access.";
            toast.error(errorMsg);
            router.push("/adminData/Management/AllUsers");
          } else if (response.status === 404) {
            errorMsg = `User with ID ${targetUserId} not found.`;
          } else {
            try {
              const errorData = await response.json();
              errorMsg = errorData.message || errorMsg;
            } catch (e) {}
          }
          throw new Error(errorMsg);
        }
        const data = await response.json();
        if (data.success && data.user) {
          setCurrentUserData(data.user);
          setFormData({
            firstname: data.user.firstname || "",
            lastname: data.user.lastname || "",
            contact: data.user.contact || "",
            newPassword: "",
          });
        } else {
          throw new Error(data.message || "Could not retrieve user data.");
        }
      } catch (err) {
        const error = err as Error;
        console.error("Fetch User Profile Error:", error);
        setError(error.message);
        toast.error(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [targetUserId, router]);

  useEffect(() => {
    if (!currentUserData) return;

    const hasFormChanges =
      formData.firstname !== currentUserData.firstname ||
      formData.lastname !== currentUserData.lastname ||
      formData.contact !== (currentUserData.contact || "") ||
      (!!formData.newPassword && formData.newPassword.trim() !== "");

    setHasChanges(hasFormChanges);
  }, [formData, currentUserData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const toggleNewPasswordVisibility = () => {
    setNewPasswordVisible((prev) => !prev);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!targetUserId) return;

    setIsSubmitting(true);
    setError(null);
    const loadingToastId = toast.loading(
      `Updating profile for ${targetUserId}...`
    );
    const payload: Partial<ProfileFormData> & { password?: string } = {
      firstname: formData.firstname,
      lastname: formData.lastname,
      contact: formData.contact,
    };

    if (formData.newPassword && formData.newPassword.trim() !== "") {
      payload.password = formData.newPassword;
    } else {
      delete payload.password;
    }

    try {
      const response = await fetch(
        `/api/adminData/editUser/${encodeURIComponent(targetUserId as string)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      toast.dismiss(loadingToastId);

      if (data.success) {
        toast.success(`Profile for ${targetUserId} updated successfully!`);
        setCurrentUserData(data.user);
        setFormData((prev) => ({ ...prev, newPassword: "" }));
        setNewPasswordVisible(false);
        router.back();
      } else {
        throw new Error(data.message || "Failed to update profile.");
      }
    } catch (err) {
      toast.dismiss(loadingToastId);
      const error = err as Error;
      console.error("Update Profile Error:", error);
      setError(error.message);
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !currentUserData) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!currentUserData) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>No user data available.</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Badge variant="outline">
                <Shield className="mr-1 h-3 w-3" />
                {currentUserData.userType}
              </Badge>
            </div>
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md mb-4">
                <AvatarImage
                  src={currentUserData.profilepic || "/default-avatar.png"}
                  alt="Profile Picture"
                />
                <AvatarFallback>
                  {currentUserData.firstname[0]}
                  {currentUserData.lastname[0]}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl font-semibold text-center">
                {currentUserData.firstname} {currentUserData.lastname}
              </CardTitle>
              <CardDescription className="text-center">
                User ID: {currentUserData.UserId}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form
              id="edit-profile-form"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <Card className="bg-muted/40">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-2">Email:</span>
                    <span className="truncate">{currentUserData.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-2">User Type:</span>
                    <span>{currentUserData.userType}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Email cannot be changed.
                  </p>
                </CardContent>
              </Card>

              <Separator />

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstname">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstname"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleChange}
                        required
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastname">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastname"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleChange}
                        required
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">
                    Contact Number{" "}
                    <span className="text-xs text-muted-foreground">
                      (Optional)
                    </span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contact"
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      className="pl-8"
                      placeholder="e.g., +1 555-123-4567"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    Set New Password{" "}
                    <span className="text-xs text-muted-foreground">
                      (Optional)
                    </span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={newPasswordVisible ? "text" : "password"}
                      value={formData.newPassword || ""}
                      onChange={handleChange}
                      className="pl-8 pr-10"
                      placeholder="Enter new password to change"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={toggleNewPasswordVisibility}
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    >
                      {newPasswordVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {newPasswordVisible ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave blank to keep the current password.
                  </p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-profile-form"
              disabled={isSubmitting || !hasChanges}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function EditUserProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading user profile...</p>
          </div>
        </div>
      }
    >
      <EditUserProfileContent />
    </Suspense>
  );
}
