"use client";

import type React from "react";
import { useEffect, useState, type FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  Camera,
  Mail,
  Phone,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  Save,
  Lock,
  AlertCircle,
  CheckCircle2,
  X,
  UserCircle,
  KeyRound,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminProfileData {
  id: string;
  AdminId?: string;
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string;
  contact?: string;
  userType: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileFormData {
  firstname: string;
  lastname: string;
  contact: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getStrength = (
    password: string
  ): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: "None", color: "bg-gray-200" };

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500",
    ];

    return {
      strength,
      label: labels[strength - 1] || "None",
      color: colors[strength - 1] || "bg-gray-200",
    };
  };

  const { strength, label, color } = getStrength(password);
  const percentage = (strength / 5) * 100;

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300 ease-in-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 flex justify-between">
        <span>Password strength:</span>
        <span
          className={`font-medium ${
            color === "bg-red-500"
              ? "text-red-500"
              : color === "bg-orange-500"
                ? "text-orange-500"
                : color === "bg-yellow-500"
                  ? "text-yellow-500"
                  : color === "bg-blue-500"
                    ? "text-blue-500"
                    : color === "bg-green-500"
                      ? "text-green-500"
                      : ""
          }`}
        >
          {password ? label : ""}
        </span>
      </p>
    </div>
  );
};

export default function ProfileAdmin() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [currentAdminData, setCurrentAdminData] =
    useState<AdminProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstname: "",
    lastname: "",
    contact: "",
  });
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(
    null
  );
  const [passwordUpdateError, setPasswordUpdateError] = useState<string | null>(
    null
  );

  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);

  const [hasProfileChanges, setHasProfileChanges] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userType: "Admin" }),
        });
        const data = await res.json();
        if (data.success && data.admin) {
          const admin = data.admin;
          setCurrentAdminData({
            ...admin,
            profilepic: `${admin.profilepic}?t=${new Date().getTime()}`,
          });
          setFormData({
            firstname: admin.firstname || "",
            lastname: admin.lastname || "",
            contact: admin.contact || "",
          });
        } else {
          throw new Error(
            data.message || "Authentication failed. Please log in."
          );
        }
      } catch (err) {
        const errorObj = err as Error;
        setError(errorObj.message);
        toast.error(`Error: ${errorObj.message}`);
        router.push("/adminData/LoginAdmin");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [router]);

  useEffect(() => {
    if (currentAdminData) {
      setHasProfileChanges(
        formData.firstname !== currentAdminData.firstname ||
          formData.lastname !== currentAdminData.lastname ||
          formData.contact !== (currentAdminData.contact || "")
      );
    }
  }, [formData, currentAdminData]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setProfileUpdateError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordUpdateError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleProfilePicButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentAdminData) {
      toast.error("Please select a file to upload.");
      return;
    }
    setIsUploadingPicture(true);
    const uploadToastId = toast.loading("Uploading picture...");
    const formDataToUpload = new FormData();
    formDataToUpload.append("profilePic", selectedFile);
    formDataToUpload.append("email", currentAdminData.email);
    try {
      const res = await fetch("/api/upload/admin-update-profile-pic", {
        method: "POST",
        body: formDataToUpload,
      });
      const data = await res.json();
      toast.dismiss(uploadToastId);
      if (data.success && data.profilePicUrl) {
        toast.success("Profile picture updated!");
        const updatedPic = `${data.profilePicUrl}?t=${new Date().getTime()}`;
        setCurrentAdminData((prev) =>
          prev ? { ...prev, profilepic: updatedPic } : null
        );
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        throw new Error(data.message || "Upload failed.");
      }
    } catch (err) {
      toast.dismiss(uploadToastId);
      const errorObj = err as Error;
      toast.error(`Upload failed: ${errorObj.message}`);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProfileUpdateSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentAdminData) return;
    if (!hasProfileChanges) {
      toast("No changes detected.", { icon: "ℹ️" });
      return;
    }
    setIsSubmittingProfile(true);
    setProfileUpdateError(null);
    const loadingToastId = toast.loading("Updating profile...");
    try {
      const res = await fetch("/api/adminData/profile/update-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      toast.dismiss(loadingToastId);
      if (data.success && data.user) {
        toast.success("Profile updated successfully!");
        setCurrentAdminData((prev) =>
          prev ? { ...prev, ...data.user } : null
        );
      } else {
        throw new Error(data.message || "Failed to update profile.");
      }
    } catch (err) {
      toast.dismiss(loadingToastId);
      const errorObj = err as Error;
      setProfileUpdateError(errorObj.message);
      toast.error(`Profile update failed: ${errorObj.message}`);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordUpdateError(null);
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordUpdateError("Please fill in all password fields.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordUpdateError("New passwords do not match.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordUpdateError(
        "New password must be at least 6 characters long."
      );
      return;
    }
    if (passwordData.newPassword === passwordData.currentPassword) {
      setPasswordUpdateError(
        "New password cannot be the same as your current password."
      );
      return;
    }
    setIsSubmittingPassword(true);
    const loadingToastId = toast.loading("Changing password...");
    try {
      const res = await fetch("/api/adminData/profile/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      toast.dismiss(loadingToastId);
      if (data.success) {
        toast.success("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setCurrentPasswordVisible(false);
        setNewPasswordVisible(false);
        setConfirmPasswordVisible(false);
      } else {
        throw new Error(data.message || "Failed to change password.");
      }
    } catch (err) {
      toast.dismiss(loadingToastId);
      const errorObj = err as Error;
      setPasswordUpdateError(errorObj.message);
      toast.error(`Password change failed: ${errorObj.message}`);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !currentAdminData) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            {error || "User not authenticated or data unavailable."}
          </AlertDescription>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/adminData/LoginAdmin")}
          >
            Return to Login
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <Card className="overflow-hidden shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-b">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar className="h-28 w-28 border-4 border-white shadow-md">
                <AvatarImage
                  src={previewUrl || currentAdminData.profilepic}
                  alt={`${currentAdminData.firstname} ${currentAdminData.lastname}`}
                />
                <AvatarFallback className="text-3xl bg-slate-200">
                  {currentAdminData.firstname[0]}
                  {currentAdminData.lastname[0]}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={handleProfilePicButtonClick}
              >
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <CardTitle className="text-2xl sm:text-3xl">
                  {currentAdminData.firstname} {currentAdminData.lastname}
                </CardTitle>
                <Badge variant="secondary" className="ml-0 sm:ml-2 self-center">
                  <Shield className="w-3 h-3 mr-1" />{" "}
                  {currentAdminData.userType}
                </Badge>
              </div>

              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{currentAdminData.email}</span>
                </div>
                {currentAdminData.contact && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{currentAdminData.contact}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedFile && (
              <div className="mt-4 sm:mt-0 flex flex-col items-center gap-3 bg-slate-50 p-4 rounded-lg border">
                <div className="text-sm font-medium">New Profile Picture</div>
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-white shadow">
                    <AvatarImage src={previewUrl || ""} alt="Preview" />
                  </Avatar>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleCancelUpload}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={isUploadingPicture}
                    className="text-xs"
                  >
                    {isUploadingPicture ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </div>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
          </div>
        </CardHeader>
      </Card>
      <Card className="shadow-md overflow-hidden">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="w-full rounded-none border-b grid grid-cols-2">
            <TabsTrigger
              value="personal"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <UserCircle className="w-4 h-4 mr-2" />
              Personal Information
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab Content */}
          <TabsContent value="personal" className="p-0 m-0">
            <CardContent className="pt-6">
              {profileUpdateError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{profileUpdateError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleProfileUpdateSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="firstname" className="text-sm font-medium">
                      First Name
                    </Label>
                    <Input
                      id="firstname"
                      name="firstname"
                      type="text"
                      value={formData.firstname}
                      onChange={handleProfileChange}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastname" className="text-sm font-medium">
                      Last Name
                    </Label>
                    <Input
                      id="lastname"
                      name="lastname"
                      type="text"
                      value={formData.lastname}
                      onChange={handleProfileChange}
                      required
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact" className="text-sm font-medium">
                    Contact Number{" "}
                    <span className="text-xs text-slate-500 font-normal">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    id="contact"
                    name="contact"
                    type="tel"
                    value={formData.contact}
                    onChange={handleProfileChange}
                    placeholder="e.g., +1 555-123-4567"
                    className="h-10"
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between pt-2 border-t bg-slate-50">
              <div className="text-xs text-slate-500">
                {hasProfileChanges ? (
                  <span className="flex items-center text-amber-600">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Unsaved changes
                  </span>
                ) : (
                  <span className="flex items-center text-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    All changes saved
                  </span>
                )}
              </div>
              <Button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget
                    .closest("div")
                    ?.previousElementSibling?.querySelector("form");
                  if (form) form.requestSubmit();
                }}
                disabled={isSubmittingProfile || !hasProfileChanges}
                className="gap-1.5"
              >
                {isSubmittingProfile ? (
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
          </TabsContent>

          <TabsContent value="security" className="p-0 m-0">
            <CardContent className="pt-6">
              {passwordUpdateError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{passwordUpdateError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="currentPassword"
                    className="text-sm font-medium"
                  >
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={currentPasswordVisible ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="pr-10 h-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setCurrentPasswordVisible(!currentPasswordVisible)
                      }
                      className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600"
                    >
                      {currentPasswordVisible ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={newPasswordVisible ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      className="pr-10 h-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                      className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600"
                    >
                      {newPasswordVisible ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <PasswordStrengthIndicator
                    password={passwordData.newPassword}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={confirmPasswordVisible ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      className="pr-10 h-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setConfirmPasswordVisible(!confirmPasswordVisible)
                      }
                      className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600"
                    >
                      {confirmPasswordVisible ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {passwordData.newPassword &&
                    passwordData.confirmPassword &&
                    passwordData.newPassword !==
                      passwordData.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Passwords do not match
                      </p>
                    )}
                </div>
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={
                      isSubmittingPassword ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword ||
                      passwordData.newPassword !== passwordData.confirmPassword
                    }
                    className="w-full gap-1.5"
                  >
                    {isSubmittingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
      \
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-slate-500" />
            <CardTitle>Account Information</CardTitle>
          </div>
          <CardDescription>
            View your account details and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500">
                  Account Type
                </h3>
                <p className="text-base font-medium mt-1 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-slate-400" />
                  {currentAdminData.userType}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500">
                  Email Address
                </h3>
                <p className="text-base font-medium mt-1 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-slate-400" />
                  {currentAdminData.email}
                </p>
              </div>

              {currentAdminData.contact && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Contact Number
                  </h3>
                  <p className="text-base font-medium mt-1 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                    {currentAdminData.contact}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {currentAdminData.createdAt && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Account Created
                  </h3>
                  <p className="text-base font-medium mt-1">
                    {new Date(currentAdminData.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              )}

              {currentAdminData.updatedAt && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Last Updated
                  </h3>
                  <p className="text-base font-medium mt-1">
                    {new Date(currentAdminData.updatedAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-slate-500">
                  Account Status
                </h3>
                <Badge className="mt-1" variant="default">
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
