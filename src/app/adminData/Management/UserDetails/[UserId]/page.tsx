"use client";

import type React from "react";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";

import {
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  AlertTriangle,
  PenSquare,
  Shield,
  CheckCircle,
  Calendar,
  Loader2,
  User,
  Clock,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserProfile {
  UserId: string;
  email: string;
  firstname: string;
  lastname: string;
  contact?: string;
  profilepic: string;
  userType: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface UserDetailsResponse {
  success: boolean;
  user?: UserProfile;
  message?: string;
}

const ProfileSkeleton: React.FC = () => (
  <Card className="mb-8">
    <CardContent className="p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Skeleton className="h-32 w-32 rounded-full" />
        <div className="flex-1 w-full space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const UserDetailCard: React.FC<{
  user: UserProfile;
  onEditClick: () => void;
}> = ({ user, onEditClick }) => {
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <Card className="mb-10 overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                <AvatarImage
                  src={user.profilepic || "/default-avatar.png"}
                  alt={`${user.firstname} ${user.lastname}`}
                />
                <AvatarFallback className="text-3xl">
                  {user.firstname[0]}
                  {user.lastname[0]}
                </AvatarFallback>
              </Avatar>
              <Badge className="absolute bottom-1 right-1 bg-green-500 h-4 w-4 rounded-full p-0 border-2 border-white" />
            </div>

            <div className="text-center md:text-left flex-grow">
              <h1 className="text-3xl font-bold text-slate-800 mb-1">
                {user.firstname} {user.lastname}
              </h1>

              <Badge variant="secondary" className="mb-4">
                <Shield className="w-3 h-3 mr-1" />
                {user.userType}
              </Badge>

              <div className="space-y-3 text-slate-600">
                <div className="flex items-center justify-center md:justify-start">
                  <Mail className="w-4 h-4 mr-2 text-slate-400" />
                  <a
                    href={`mailto:${user.email}`}
                    className="hover:text-primary"
                  >
                    {user.email}
                  </a>
                </div>

                <div className="flex items-center justify-center md:justify-start">
                  <FileText className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="text-sm">User ID: {user.UserId}</span>
                </div>

                {user.contact && (
                  <div className="flex items-center justify-center md:justify-start">
                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                    <span>{user.contact}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center md:text-left">
                <Button onClick={onEditClick} className="gap-1.5">
                  <PenSquare className="w-4 h-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-500">
              Account Created
            </h3>
            <p className="text-base font-medium flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
              {formatDate(user.createdAt)}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-500">Last Updated</h3>
            <p className="text-base font-medium flex items-center">
              <Clock className="w-4 h-4 mr-2 text-slate-400" />
              {formatDate(user.updatedAt)}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-500">
              Account Status
            </h3>
            <Badge className="mt-1" variant="outline">
              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
              Active
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function UserDetailsContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const UserIdParam = params?.UserId;
  const targetUserId = Array.isArray(UserIdParam)
    ? UserIdParam[0]
    : UserIdParam;

  useEffect(() => {
    if (!targetUserId) {
      setError("User ID not found in URL.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const encodedUserId = encodeURIComponent(targetUserId as string);
        const response = await fetch(
          `/api/adminData/UserDetails/${encodedUserId}`
        );

        if (!response.ok) {
          let errorMsg = "Failed to fetch user details.";
          if (response.status === 401 || response.status === 403) {
            errorMsg = "Unauthorized access.";
            router.push("/adminData/LoginAdmin");
          } else if (response.status === 404) {
            errorMsg = `User with ID ${targetUserId} not found.`;
          } else {
            try {
              const d = await response.json();
              errorMsg = d.message || errorMsg;
            } catch (e) {
              /* ignore */
            }
          }
          throw new Error(errorMsg);
        }

        const data: UserDetailsResponse = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          throw new Error(data.message || "Could not retrieve user details.");
        }
      } catch (err) {
        console.error("Fetch User Details Error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetUserId, router]);

  const handleEditClick = () => {
    if (!user) return;
    const encodedUserId = encodeURIComponent(user.UserId);
    router.push(`/adminData/Management/EditUserProfile/${encodedUserId}`);
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
        </div>
        <ProfileSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
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
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            User data could not be loaded or user not found.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="ml-auto">
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">View more options</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>More options</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <h1 className="text-3xl font-bold text-slate-800 mb-6">User Details</h1>
      <UserDetailCard user={user} onEditClick={handleEditClick} />
      <div className="mb-8">
        <div className="flex items-center mb-5">
          <h2 className="text-2xl font-semibold flex items-center">
            <User className="w-5 h-5 mr-2 text-primary" />
            User Activity
          </h2>
          <Separator className="flex-grow ml-4" />
        </div>

        <Card className="bg-muted/40">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <User className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground italic">
              No recent activity to display.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function UserDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading user details...</p>
          </div>
        </div>
      }
    >
      <UserDetailsContent />
    </Suspense>
  );
}
