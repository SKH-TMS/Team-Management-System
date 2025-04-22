"use client";

import type React from "react";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  User,
  Mail,
  Phone,
  FileText,
  Users,
  AlertTriangle,
  PenSquare,
  ArrowLeft,
  ExternalLink,
  Shield,
  CheckCircle,
  Loader2,
  Crown,
  UserPlus,
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
}

interface TeamDetails {
  _id: string;
  teamId: string;
  teamName: string;
  members?: string[];
  teamLeader?: string[];
}

const ProfileSkeleton: React.FC = () => (
  <Card className="mb-8">
    <CardContent className="p-6">
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
        <Skeleton className="w-32 h-32 rounded-full" />
        <div className="flex-1 w-full space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const TeamCardSkeleton: React.FC<{ type: "leader" | "member" }> = ({
  type,
}) => (
  <Card
    className={
      type === "leader"
        ? "bg-gradient-to-br from-amber-50 to-amber-100"
        : "bg-gradient-to-br from-blue-50 to-blue-100"
    }
  >
    <CardContent className="p-4">
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Separator className="my-2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </CardContent>
  </Card>
);

const UserProfileCard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const router = useRouter();

  const handleEditClick = () => {
    const encodedUserId = encodeURIComponent(user.UserId);
    router.push(`/adminData/Management/EditUserProfile/${encodedUserId}`);
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
                <Button onClick={handleEditClick} className="gap-1.5">
                  <PenSquare className="w-4 h-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TeamCard: React.FC<{ team: TeamDetails; type: "leader" | "member" }> = ({
  team,
  type,
}) => {
  const router = useRouter();
  const memberCount = team.members?.length ?? "?";
  const leaderCount = team.teamLeader?.length ?? "?";

  const handleViewTeamDetails = () => {
    const encodedTeamId = encodeURIComponent(team.teamId);
    router.push(`/adminData/Management/TeamDetails/${encodedTeamId}`);
  };

  const cardStyle =
    type === "leader"
      ? "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border-amber-200 hover:shadow-amber-100"
      : "bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-blue-200 hover:shadow-blue-100";

  const IconComponent = type === "leader" ? Crown : UserPlus;
  const accentColor = type === "leader" ? "text-amber-600" : "text-blue-600";
  const hoverColor =
    type === "leader"
      ? "group-hover:text-amber-700"
      : "group-hover:text-blue-700";

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border group ${cardStyle}`}
      onClick={handleViewTeamDetails}
    >
      <CardContent className="p-5">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <IconComponent className={`w-5 h-5 ${accentColor}`} />
                <h3
                  className={`text-xl font-semibold ${accentColor} ${hoverColor}`}
                >
                  {team.teamName}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                ID: {team.teamId}
              </p>
            </div>
            <Badge
              variant={type === "leader" ? "default" : "secondary"}
              className={
                type === "leader" ? "bg-amber-500 hover:bg-amber-600" : ""
              }
            >
              {type === "leader" ? "Leader" : "Member"}
            </Badge>
          </div>

          <Separator
            className={type === "leader" ? "bg-amber-200" : "bg-blue-200"}
          />

          <div className="text-sm text-slate-600 space-y-2">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-slate-400" />
              <span>Members: {memberCount}</span>
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1.5 text-slate-400" />
              <span>Leaders: {leaderCount}</span>
            </div>
          </div>

          <div className="flex justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${type === "leader" ? "hover:bg-amber-200/50" : "hover:bg-blue-200/50"}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View team details</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View team details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TeamGrid: React.FC<{
  title: string;
  teams: TeamDetails[] | null;
  isLoading: boolean;
  type: "leader" | "member";
}> = ({ title, teams, isLoading, type }) => {
  const titleColor = type === "leader" ? "text-amber-700" : "text-blue-700";
  const iconComponent =
    type === "leader" ? (
      <Crown className="w-5 h-5 mr-2" />
    ) : (
      <UserPlus className="w-5 h-5 mr-2" />
    );
  const emptyIcon =
    type === "leader" ? (
      <Crown className="w-10 h-10 text-amber-300" />
    ) : (
      <UserPlus className="w-10 h-10 text-blue-300" />
    );
  const separatorColor = type === "leader" ? "bg-amber-200" : "bg-blue-200";
  const emptyCardBg = type === "leader" ? "bg-amber-50" : "bg-blue-50";

  return (
    <div className="mb-12">
      <div className="flex items-center mb-5">
        <h2
          className={`text-2xl font-semibold flex items-center ${titleColor}`}
        >
          {iconComponent}
          {title}
        </h2>
        <Separator className={`flex-grow ml-4 ${separatorColor}`} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <TeamCardSkeleton key={i} type={type} />
          ))}
        </div>
      ) : teams && teams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => (
            <TeamCard key={team.teamId || team._id} team={team} type={type} />
          ))}
        </div>
      ) : (
        <Card className={emptyCardBg}>
          <CardContent className="flex flex-col items-center justify-center py-8">
            {emptyIcon}
            <p className="text-muted-foreground italic mt-2">
              No teams found in this category for this user.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="container mx-auto p-4 md:p-6 lg:p-8">
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  </div>
);

function ParticipantDetailsContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [teamsLed, setTeamsLed] = useState<TeamDetails[] | null>(null);
  const [teamsMemberOf, setTeamsMemberOf] = useState<TeamDetails[] | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const UserIdParam = params?.UserId;
  const UserId = Array.isArray(UserIdParam) ? UserIdParam[0] : UserIdParam;

  useEffect(() => {
    if (!UserId) {
      setError("User ID parameter is missing from URL.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const encodedUserId = encodeURIComponent(UserId as string);
        const response = await fetch(
          `/api/adminData/ParticipantDetails/${encodedUserId}`
        );

        if (!response.ok) {
          let errorMsg = `API Error (${response.status}): ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
            if (response.status === 404) {
              errorMsg = `User with ID ${decodeURIComponent(UserId as string)} not found.`;
            } else if (response.status === 403) {
              errorMsg = "Unauthorized Access";
              router.push("/adminData/LoginAdmin");
            }
          } catch (e) {}
          throw new Error(errorMsg);
        }

        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          setTeamsLed(data.teamsLed || []);
          setTeamsMemberOf(data.teamsMemberOf || []);
        } else {
          throw new Error(
            data.message || "Failed to fetch participant details."
          );
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [UserId, router]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-800">
            Participant Details
          </h1>
          <Skeleton className="h-10 w-24" />
        </div>

        <ProfileSkeleton />
        <TeamGrid
          title="Teams Leader of"
          teams={null}
          isLoading={true}
          type="leader"
        />
        <TeamGrid
          title="Member of"
          teams={null}
          isLoading={true}
          type="member"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <ErrorMessage message={error} />
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
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <ErrorMessage message="Participant data could not be loaded or user not found." />
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
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <Badge variant="outline" className="gap-1">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          Active User
        </Badge>
      </div>

      <h1 className="text-3xl font-bold text-slate-800 mb-6">
        Participant Details
      </h1>
      <UserProfileCard user={user} />
      <TeamGrid
        title="Teams Leader of"
        teams={teamsLed}
        isLoading={false}
        type="leader"
      />
      <TeamGrid
        title="Member of"
        teams={teamsMemberOf}
        isLoading={false}
        type="member"
      />
    </div>
  );
}

export default function ParticipantDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-8 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Loading participant details...
            </p>
          </div>
        </div>
      }
    >
      <ParticipantDetailsContent />
    </Suspense>
  );
}
