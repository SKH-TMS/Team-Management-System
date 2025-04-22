"use client";

import type React from "react";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";

import {
  ArrowLeft,
  Users,
  User,
  Hash,
  ClipboardList,
  AlertTriangle,
  Star,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  Briefcase,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// --- Interface Definitions ---
interface MemberProfile {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string;
}

interface ProjectDetails {
  ProjectId: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

interface AssignedProject {
  _id: string;
  AssignProjectId: string;
  projectId: ProjectDetails;
  assignedBy: string | { UserId: string; firstname: string; lastname: string };
  deadline: string;
  createdAt: string;
}

interface PopulatedTeamDetails {
  _id: string;
  teamId: string;
  teamName: string;
  members: MemberProfile[];
  teamLeader: MemberProfile[];
  createdBy?: string | { UserId: string; firstname: string; lastname: string };
  createdAt: string;
  updatedAt: string;
}

interface TeamDetailsResponse {
  success: boolean;
  teamDetails?: PopulatedTeamDetails;
  assignedProjects?: AssignedProject[];
  message?: string;
}

const TeamDetailsSkeleton: React.FC = () => (
  <div className="space-y-8">
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardFooter>
    </Card>

    <div>
      <Skeleton className="h-7 w-48 mb-5" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div>
      <Skeleton className="h-7 w-48 mb-5" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    <div>
      <Skeleton className="h-7 w-48 mb-5" />
      <div className="space-y-5">
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
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const MemberCard: React.FC<{ member: MemberProfile }> = ({ member }) => {
  const router = useRouter();

  const handleNavigateToDetails = () => {
    const encodedUserId = encodeURIComponent(member.UserId);
    router.push(`/adminData/Management/ParticipantDetails/${encodedUserId}`);
  };

  return (
    <Card
      className="hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
      onClick={handleNavigateToDetails}
    >
      <CardContent className="p-4 flex items-center space-x-4">
        <Avatar className="h-12 w-12 border border-border">
          <AvatarImage
            src={member.profilepic || "/default-avatar.png"}
            alt={`${member.firstname} ${member.lastname}`}
          />
          <AvatarFallback>
            {member.firstname[0]}
            {member.lastname[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {member.firstname} {member.lastname}
          </p>
          <a
            href={`mailto:${member.email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-600 hover:underline truncate block"
          >
            {member.email}
          </a>
          <p className="text-xs text-muted-foreground truncate mt-1 flex items-center">
            <FileText className="w-3 h-3 mr-1 inline" />
            {member.UserId}
          </p>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardContent>
    </Card>
  );
};

const LeaderCard: React.FC<{ leader: MemberProfile }> = ({ leader }) => {
  const router = useRouter();

  const handleNavigateToDetails = () => {
    const encodedUserId = encodeURIComponent(leader.UserId);
    router.push(`/adminData/Management/ParticipantDetails/${encodedUserId}`);
  };

  return (
    <Card
      className="hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden border-l-4 border-l-amber-400"
      onClick={handleNavigateToDetails}
    >
      <CardContent className="p-4 flex items-center space-x-4 bg-gradient-to-r from-amber-50 to-transparent">
        <Avatar className="h-12 w-12 border-2 border-amber-200">
          <AvatarImage
            src={leader.profilepic || "/default-avatar.png"}
            alt={`${leader.firstname} ${leader.lastname}`}
          />
          <AvatarFallback>
            {leader.firstname[0]}
            {leader.lastname[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {leader.firstname} {leader.lastname}
          </p>
          <a
            href={`mailto:${leader.email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-600 hover:underline truncate block"
          >
            {leader.email}
          </a>
          <p className="text-xs text-muted-foreground truncate mt-1 flex items-center">
            <FileText className="w-3 h-3 mr-1 inline" />
            {leader.UserId}
          </p>
        </div>
        <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
      </CardContent>
    </Card>
  );
};

const ProjectCard: React.FC<{ assignment: AssignedProject }> = ({
  assignment,
}) => {
  const router = useRouter();
  const project = assignment.projectId;

  const handleNavigateToDetails = () => {
    const encodedProjectId = encodeURIComponent(project.ProjectId);
    router.push(
      `/adminData/Management/ProjectTasksDetails/${encodedProjectId}`
    );
  };

  const deadlineDate = assignment.deadline
    ? format(new Date(assignment.deadline), "MMM d, yyyy")
    : "N/A";
  const assignedDate = assignment.createdAt
    ? format(new Date(assignment.createdAt), "MMM d, yyyy")
    : "N/A";

  // Helper to get status badge properties
  const getStatusBadge = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          variant: "default" as const,
          icon: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
        };
      case "in progress":
        return {
          variant: "outline" as const,
          icon: <Clock className="w-3.5 h-3.5 mr-1" />,
        };
      case "pending":
        return {
          variant: "destructive" as const,
          icon: <Clock className="w-3.5 h-3.5 mr-1" />,
        };
      default:
        return {
          variant: "secondary" as const,
          icon: <Briefcase className="w-3.5 h-3.5 mr-1" />,
        };
    }
  };

  const statusBadge = getStatusBadge(project?.status);

  return (
    <Card
      className="hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={handleNavigateToDetails}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="text-lg font-semibold text-primary group-hover:text-primary/80 transition-colors">
              {project?.title || "Project Title Missing"}
            </h4>
            <p className="text-xs text-muted-foreground mb-1 flex items-center">
              <Hash className="w-3 h-3 mr-1 inline" />
              {project?.ProjectId || "N/A"}
            </p>
          </div>
          <Badge variant={statusBadge.variant} className="flex items-center">
            {statusBadge.icon}
            {project?.status || "N/A"}
          </Badge>
        </div>

        <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
          {project?.description || "No description."}
        </p>

        <Separator className="my-4" />

        <div className="flex flex-wrap items-center justify-between gap-y-2 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <span className="font-medium mr-1">Assigned:</span> {assignedDate}
          </div>
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <span className="font-medium mr-1">Deadline:</span> {deadlineDate}
          </div>
          <div className="flex items-center ml-auto">
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function ParticipantTeamDetailsContent() {
  const [teamDetails, setTeamDetails] = useState<PopulatedTeamDetails | null>(
    null
  );
  const [assignedProjects, setAssignedProjects] = useState<
    AssignedProject[] | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const teamIdParam = params?.teamId;
  const targetTeamId = Array.isArray(teamIdParam)
    ? teamIdParam[0]
    : teamIdParam;

  useEffect(() => {
    if (!targetTeamId) {
      setError("Team ID not found in URL.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const encodedTeamId = encodeURIComponent(targetTeamId as string);
        const response = await fetch(
          `/api/adminData/teamDetails/${encodedTeamId}`
        );

        if (!response.ok) {
          let errorMsg = "Failed to fetch team details.";
          if (response.status === 401 || response.status === 403) {
            errorMsg = "Unauthorized access.";
            router.push("/adminData/LoginAdmin");
          } else if (response.status === 404) {
            errorMsg = `Team with ID ${targetTeamId} not found.`;
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

        const data: TeamDetailsResponse = await response.json();
        if (data.success) {
          setTeamDetails(data.teamDetails || null);
          setAssignedProjects(data.assignedProjects || []);
        } else {
          throw new Error(data.message || "Could not retrieve team details.");
        }
      } catch (err) {
        console.error("Fetch Team Details Error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetTeamId, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <TeamDetailsSkeleton />
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

  if (!teamDetails) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            Team data could not be loaded or team not found.
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

  const leaderIds = new Set(
    teamDetails.teamLeader?.map((leader) => leader.UserId) || []
  );
  const regularMembers =
    teamDetails.members?.filter((member) => !leaderIds.has(member.UserId)) ||
    [];

  const createdDate = format(new Date(teamDetails.createdAt), "MMM d, yyyy");
  const updatedDate = format(new Date(teamDetails.updatedAt), "MMM d, yyyy");

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="mb-10 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
          <CardTitle className="text-3xl">{teamDetails.teamName}</CardTitle>
          <CardDescription className="flex items-center">
            <Hash className="w-3.5 h-3.5 mr-1.5 inline" />
            Team ID: {teamDetails.teamId}
          </CardDescription>
        </CardHeader>
        <CardFooter className="py-4 text-xs text-muted-foreground flex justify-between flex-wrap gap-2 border-t">
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Created: {createdDate}
          </div>
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Last Updated: {updatedDate}
          </div>
        </CardFooter>
      </Card>

      <section className="mb-12">
        <div className="flex items-center mb-5">
          <h2 className="text-2xl font-semibold flex items-center">
            <Star className="w-5 h-5 mr-2 text-amber-500" />
            Team Leader(s)
            <Badge variant="outline" className="ml-2">
              {teamDetails.teamLeader?.length ?? 0}
            </Badge>
          </h2>
          <Separator className="flex-grow ml-4" />
        </div>

        {teamDetails.teamLeader && teamDetails.teamLeader.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teamDetails.teamLeader.map((leader) => (
              <LeaderCard key={leader.UserId} leader={leader} />
            ))}
          </div>
        ) : (
          <Card className="bg-amber-50">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <User className="w-10 h-10 text-amber-300 mb-2" />
              <p className="text-muted-foreground italic">
                No designated leader found.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="mb-12">
        <div className="flex items-center mb-5">
          <h2 className="text-2xl font-semibold flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            Team Members
            <Badge variant="outline" className="ml-2">
              {regularMembers.length}
            </Badge>
          </h2>
          <Separator className="flex-grow ml-4" />
        </div>

        {regularMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {regularMembers.map((member) => (
              <MemberCard key={member.UserId} member={member} />
            ))}
          </div>
        ) : (
          <Card className="bg-muted/40">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Users className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground italic">
                No other members in this team.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <div className="flex items-center mb-5">
          <h2 className="text-2xl font-semibold flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-primary" />
            Assigned Projects
            <Badge variant="outline" className="ml-2">
              {assignedProjects?.length ?? 0}
            </Badge>
          </h2>
          <Separator className="flex-grow ml-4" />
        </div>

        {assignedProjects && assignedProjects.length > 0 ? (
          <div className="space-y-5">
            {assignedProjects.map((assignment) =>
              assignment.projectId ? (
                <ProjectCard key={assignment._id} assignment={assignment} />
              ) : (
                <Alert variant="destructive" key={assignment._id}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Missing Data</AlertTitle>
                  <AlertDescription>
                    Project data missing for assignment{" "}
                    {assignment.AssignProjectId}
                  </AlertDescription>
                </Alert>
              )
            )}
          </div>
        ) : (
          <Card className="bg-muted/40">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Briefcase className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground italic">
                No projects currently assigned.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

export default function ParticipantTeamDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading team details...</p>
          </div>
        </div>
      }
    >
      <ParticipantTeamDetailsContent />
    </Suspense>
  );
}
