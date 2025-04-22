"use client";

import type React from "react";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";

import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  FileText,
  AlertTriangle,
  PenSquare,
  ExternalLink,
  Shield,
  CheckCircle,
  Clock,
  Briefcase,
  Loader2,
  Star,
  Calendar,
  Hash,
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

interface TeamSummary {
  _id: string;
  teamId: string;
  teamName: string;
  members?: string[];
  teamLeader?: string[];
}

interface ProjectSummary {
  _id: string;
  ProjectId: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

interface PMDetailsResponse {
  success: boolean;
  pmDetails?: UserProfile;
  createdTeams?: TeamSummary[];
  unassignedProjects?: ProjectSummary[];
  message?: string;
}

const PMDetailsSkeleton: React.FC = () => (
  <div className="space-y-8">
    <Card>
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

    <div>
      <Skeleton className="h-7 w-48 mb-5" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Separator />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    <div>
      <Skeleton className="h-7 w-48 mb-5" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Separator />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const PMProfileCard: React.FC<{ user: UserProfile }> = ({ user }) => {
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

const TeamSummaryCard: React.FC<{ team: TeamSummary }> = ({ team }) => {
  const router = useRouter();
  const memberCount = team.members?.length ?? 0;
  const leaderCount = team.teamLeader?.length ?? 0;

  const handleViewTeamDetails = () => {
    const encodedTeamId = encodeURIComponent(team.teamId);
    router.push(`/adminData/Management/TeamDetails/${encodedTeamId}`);
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 border-l-indigo-400"
      onClick={handleViewTeamDetails}
    >
      <CardContent className="p-0">
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50 p-5 relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full -mr-12 -mt-12 opacity-30"></div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-indigo-700 group-hover:text-indigo-800 transition-colors">
                  {team.teamName}
                </h3>
                <p className="text-xs text-indigo-500/70 mt-1 flex items-center">
                  <Hash className="w-3 h-3 mr-1" />
                  {team.teamId}
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-indigo-100 text-indigo-700 border-indigo-200"
              >
                Team
              </Badge>
            </div>

            <Separator className="bg-indigo-100" />

            <div className="text-sm text-slate-600 space-y-2">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1.5 text-indigo-400" />
                <span className="font-medium text-indigo-600">
                  {memberCount}
                </span>
                <span className="ml-1 text-slate-500">Members</span>
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1.5 text-amber-400" />
                <span className="font-medium text-indigo-600">
                  {leaderCount}
                </span>
                <span className="ml-1 text-slate-500">Leaders</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100/50"
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
        </div>
      </CardContent>
    </Card>
  );
};

const UnassignedProjectCard: React.FC<{ project: ProjectSummary }> = ({
  project,
}) => {
  const getStatusBadge = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          variant: "outline" as const,
          className:
            "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
          icon: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
          color: "text-green-600",
          bgColor: "from-green-50 via-emerald-50 to-teal-50",
          borderColor: "border-l-green-400",
        };
      case "in progress":
        return {
          variant: "default" as const,
          icon: <Clock className="w-3.5 h-3.5 mr-1" />,
          color: "text-blue-600",
          bgColor: "from-blue-50 via-sky-50 to-slate-50",
          borderColor: "border-l-blue-400",
        };
      case "pending":
        return {
          variant: "outline" as const,
          className:
            "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
          icon: <Clock className="w-3.5 h-3.5 mr-1" />,
          color: "text-amber-600",
          bgColor: "from-amber-50 via-yellow-50 to-slate-50",
          borderColor: "border-l-amber-400",
        };
      default:
        return {
          variant: "secondary" as const,
          icon: <Briefcase className="w-3.5 h-3.5 mr-1" />,
          color: "text-slate-600",
          bgColor: "from-slate-50 via-gray-50 to-slate-100",
          borderColor: "border-l-slate-400",
        };
    }
  };

  const statusBadge = getStatusBadge(project.status);
  const createdDate = project.createdAt
    ? format(new Date(project.createdAt), "MMM d, yyyy")
    : "N/A";

  return (
    <Card
      className={`overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 ${statusBadge.borderColor}`}
    >
      <CardContent className="p-0">
        <div
          className={`bg-gradient-to-br ${statusBadge.bgColor} p-5 relative`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full -mr-16 -mt-16 opacity-40"></div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4
                  className={`text-lg font-semibold ${statusBadge.color} group-hover:opacity-80 transition-colors`}
                >
                  {project.title || "Project Title Missing"}
                </h4>
                <p className="text-xs text-muted-foreground mb-1 flex items-center">
                  <Hash className="w-3 h-3 mr-1 inline" />
                  {project.ProjectId || "N/A"}
                </p>
              </div>
              <Badge
                variant={statusBadge.variant}
                className={`flex items-center ${statusBadge.className || ""}`}
              >
                {statusBadge.icon}
                {project.status || "N/A"}
              </Badge>
            </div>

            <p className="text-sm text-foreground/80 mb-2 line-clamp-3 bg-white/40 p-2 rounded-md shadow-sm">
              {project.description || "No description."}
            </p>

            <Separator className="bg-white/60" />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                <span>Created: {createdDate}</span>
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function ProjectManagerDetailsContent() {
  const [pmDetails, setPmDetails] = useState<UserProfile | null>(null);
  const [createdTeams, setCreatedTeams] = useState<TeamSummary[] | null>(null);
  const [unassignedProjects, setUnassignedProjects] = useState<
    ProjectSummary[] | null
  >(null);
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
          `/api/adminData/ProjectManagerDetails/${encodedUserId}`
        );

        if (!response.ok) {
          let errorMsg = "Failed to fetch details.";
          if (response.status === 401 || response.status === 403) {
            errorMsg = "Unauthorized access.";
            router.push("/adminData/LoginAdmin");
          } else if (response.status === 404) {
            errorMsg = `Project Manager with ID ${targetUserId} not found.`;
          } else {
            try {
              const d = await response.json();
              errorMsg = d.message || errorMsg;
            } catch (e) {}
          }
          throw new Error(errorMsg);
        }

        const data: PMDetailsResponse = await response.json();
        if (data.success) {
          setPmDetails(data.pmDetails || null);
          setCreatedTeams(data.createdTeams || []);
          setUnassignedProjects(data.unassignedProjects || []);
        } else {
          throw new Error(data.message || "Could not retrieve details.");
        }
      } catch (err) {
        console.error("Fetch PM Details Error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetUserId, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
        </div>
        <PMDetailsSkeleton />
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

  if (!pmDetails) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            Project Manager data could not be loaded or user not found.
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

        <Badge variant="outline" className="gap-1">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          Active User
        </Badge>
      </div>

      <h1 className="text-3xl font-bold text-slate-800 mb-6">
        Project Manager Details
      </h1>

      <PMProfileCard user={pmDetails} />

      <section className="mb-12">
        <div className="flex items-center mb-5">
          <h2 className="text-2xl font-semibold flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            Teams Created
            <Badge variant="outline" className="ml-2">
              {createdTeams?.length ?? 0}
            </Badge>
          </h2>
          <Separator className="flex-grow ml-4" />
        </div>

        {createdTeams && createdTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {createdTeams.map((team) => (
              <TeamSummaryCard key={team.teamId || team._id} team={team} />
            ))}
          </div>
        ) : (
          <Card className="bg-muted/40">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Users className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground italic">
                This Project Manager has not created any teams.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <div className="flex items-center mb-5">
          <h2 className="text-2xl font-semibold flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-primary" />
            Unassigned Projects
            <Badge variant="outline" className="ml-2">
              {unassignedProjects?.length ?? 0}
            </Badge>
          </h2>
          <Separator className="flex-grow ml-4" />
        </div>

        {unassignedProjects && unassignedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {unassignedProjects.map((project) => (
              <UnassignedProjectCard
                key={project.ProjectId || project._id}
                project={project}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-muted/40">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Briefcase className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground italic">
                No unassigned projects created by this Project Manager.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

export default function ProjectManagerDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Loading project manager details...
            </p>
          </div>
        </div>
      }
    >
      <ProjectManagerDetailsContent />
    </Suspense>
  );
}
