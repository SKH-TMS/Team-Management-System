"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react"; // Added useCallback
import { useParams, useRouter } from "next/navigation";
import Image from "next/image"; // Keep Image for profile pics if used directly
import { format } from "date-fns"; // For date formatting
// Shadcn/ui Components & Lucide Icons
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator"; // Added Separator
import { Label } from "@/components/ui/label"; // Added Label
import {
  ArrowLeft,
  ListChecks as ListBulletIcon,
  Calendar as CalendarDaysIcon,
  CheckCircle2 as CheckCircleIcon,
  Clock,
  Link as LinkIcon,
  MessageSquare as ChatBubbleBottomCenterTextIcon,
  Info,
  Users,
  Briefcase,
  AlertCircle,
  FileText, // Added FileText
  Paperclip, // Using Paperclip as default/unknown status icon
  RefreshCw,
  ListCheck,
  ListChecks,
  Loader2, // Added RefreshCw
} from "lucide-react"; // Replaced Heroicons

import { cn } from "@/lib/utils";

// --- Interfaces (Aligned with previous examples) ---
interface Project {
  // Renamed from ProjectDetailsData for consistency
  _id: string; // Keep _id if returned by API
  ProjectId: string;
  title: string;
  description: string;
  status: string;
  createdBy: string; // Consider if this needs population later
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  deadline?: string; // Added deadline based on other pages
}

interface Member {
  // Renamed from AssigneeProfile for consistency
  _id?: string; // Keep _id if returned by API
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic?: string; // Made optional
  email: string;
}

interface Task {
  // Renamed from TaskDetailsData for consistency
  _id: string; // Keep _id if returned by API
  TaskId: string;
  title: string;
  description: string;
  assignedTo: Member[]; // Use Member interface, assume API returns array of Members
  deadline: string; // ISO String
  status: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  gitHubUrl?: string;
  context?: string;
  submittedby?: string | Member | null; // Allow string ID or populated Member
}

interface ProjectTasksResponse {
  // Keep response structure as is for now
  success: boolean;
  projectDetails?: Project; // Use updated Project interface
  tasks?: Task[]; // Use updated Task interface
  message?: string;
}
// --- End Interfaces ---

// --- Skeleton Component (Updated with Shadcn) ---
const ProjectTasksSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    {/* Project Card Skeleton */}
    <Card className="mb-8">
      <CardHeader>
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
      </CardFooter>
    </Card>

    {/* Task List Skeleton */}
    <Skeleton className="h-7 w-1/3 mb-5" />
    <div className="space-y-5">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-5 w-1/4 rounded-full" />
            </div>
            <Skeleton className="h-3 w-1/3 mt-1" /> {/* Task ID */}
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
          <CardFooter className="flex items-center justify-between pt-4">
            <div className="flex -space-x-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
            <Skeleton className="h-4 w-1/4" />
          </CardFooter>
        </Card>
      ))}
    </div>
  </div>
);
// --- End Skeleton Component ---

// --- Project Details Card (Updated with Shadcn) ---
const ProjectDetailsCard: React.FC<{ project: Project }> = ({ project }) => {
  const getStatusBadge = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          color: "bg-green-100 text-green-800 border-green-300",
          icon: <CheckCircleIcon className="w-3.5 h-3.5" />,
        };
      case "in progress":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-300",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-300",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-300",
          icon: <Paperclip className="w-3.5 h-3.5" />,
        };
    }
  };
  const statusBadge = getStatusBadge(project.status);

  return (
    <Card className="mb-8 sm:mb-10 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 shadow-md border-0">
      <CardHeader className="p-4 sm:p-6 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-primary mb-1">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary/80 flex-shrink-0" />
              <span className="truncate">{project.title}</span>
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Project ID: {project.ProjectId}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs px-2.5 py-1 border-l-4 whitespace-nowrap",
              statusBadge.color
            )}
          >
            {statusBadge.icon}
            <span className="ml-1.5">{project.status || "N/A"}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
          {project.description || "No description provided."}
        </p>
        <Separator className="my-3" />
        <div className="text-xs text-gray-500 flex items-center justify-between flex-wrap gap-2">
          <span>Created: {format(new Date(project.createdAt), "PP")}</span>
          <span>Last Updated: {format(new Date(project.updatedAt), "PP")}</span>
          {/* Consider adding Created By if populated */}
          {/* <span>Created By: {project.createdBy}</span> */}
        </div>
      </CardContent>
    </Card>
  );
};
// --- End Project Details Card ---

// --- Task Card (Updated with Shadcn) ---
const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const deadlineDate = task.deadline
    ? format(new Date(task.deadline), "PP")
    : "N/A"; // Simpler format

  const getStatusBadge = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          color: "bg-green-100 text-green-800 border-green-300",
          icon: <CheckCircleIcon className="w-3.5 h-3.5" />,
        };
      case "in progress":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-300",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-300",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case "re assigned":
        return {
          color: "bg-purple-100 text-purple-800 border-purple-300",
          icon: <RefreshCw className="w-3.5 h-3.5" />,
        }; // Changed icon
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-300",
          icon: <Paperclip className="w-3.5 h-3.5" />,
        };
    }
  };
  const statusBadge = getStatusBadge(task.status);

  const getInitials = (firstname?: string, lastname?: string) => {
    if (!firstname) return "?";
    if (!lastname) return firstname.charAt(0).toUpperCase();
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="overflow-hidden shadow border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 line-clamp-2">
            {task.title}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              "text-xs px-2 py-0.5 border-l-4 whitespace-nowrap",
              statusBadge.color
            )}
          >
            {statusBadge.icon}
            <span className="ml-1.5">{task.status || "N/A"}</span>
          </Badge>
        </div>
        <CardDescription className="text-xs text-gray-400 pt-1">
          Task ID: {task.TaskId}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-1 pb-3 space-y-3">
        <p className="text-sm text-gray-600 line-clamp-3">
          {task.description || "No description."}
        </p>

        {(task.context || task.gitHubUrl) && (
          <div className="pt-3 border-t border-gray-100 text-sm space-y-2">
            {task.context && (
              <div className="flex items-start">
                <ChatBubbleBottomCenterTextIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                <p className="text-gray-600">
                  <span className="font-medium">Context:</span> {task.context}
                </p>
              </div>
            )}
            {task.gitHubUrl && (
              <div className="flex items-start">
                <LinkIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                <a
                  href={task.gitHubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                  title={task.gitHubUrl} // Add title for full URL on hover
                >
                  GitHub Link
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-3 flex items-center justify-between border-t border-gray-100 bg-slate-50/50">
        <div className="flex items-center text-xs text-gray-500">
          <CalendarDaysIcon className="w-4 h-4 mr-1 text-gray-400" />
          <span>Deadline: {deadlineDate}</span>
        </div>
      </CardFooter>
    </Card>
  );
};
// --- End Task Card ---

// --- Error Component (Updated with Shadcn) ---
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="container mx-auto p-4 md:p-6 lg:p-8">
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
    {/* Optional: Add a back button here too if needed */}
    {/* <Button variant="outline" onClick={() => router.back()} className="mt-4">Go Back</Button> */}
  </div>
);
// --- End Error Component ---

// --- Main Content Component ---
function ProjectTasksDetailsContent() {
  const [projectDetails, setProjectDetails] = useState<Project | null>(null); // Use updated interface
  const [tasks, setTasks] = useState<Task[] | null>(null); // Use updated interface
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const projectIdParam = params?.projectId;
  const targetProjectId = Array.isArray(projectIdParam)
    ? projectIdParam[0]
    : projectIdParam;

  // Keep existing fetch logic, but update state types
  useEffect(() => {
    if (!targetProjectId) {
      setError("Project ID not found in URL.");
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const encodedProjectId = encodeURIComponent(targetProjectId);
        const response = await fetch(
          `/api/adminData/ProjectTasksDetails/${encodedProjectId}`
        ); // Ensure this API returns data matching new interfaces
        if (!response.ok) {
          let errorMsg = "Failed to fetch project details.";
          if (response.status === 401 || response.status === 403) {
            errorMsg = "Unauthorized access.";
            router.push("/adminData/LoginAdmin");
          } else if (response.status === 404)
            errorMsg = `Project with ID ${targetProjectId} not found.`;
          else {
            try {
              const d = await response.json();
              errorMsg = d.message || errorMsg;
            } catch (e) {}
          }
          throw new Error(errorMsg);
        }
        const data: ProjectTasksResponse = await response.json(); // Use updated interfaces here
        if (data.success) {
          setProjectDetails(data.projectDetails || null);
          setTasks(data.tasks || []);
        } else {
          throw new Error(
            data.message || "Could not retrieve project details."
          );
        }
      } catch (err) {
        console.error("Fetch Project Details Error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [targetProjectId, router]); // Added router to dependency array

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <ProjectTasksSkeleton /> {/* Use updated skeleton */}
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
    {
      /* Use updated error component */
    }
  }

  if (!projectDetails) {
    return (
      <ErrorMessage message="Project data could not be loaded or project not found." />
    );
  }

  return (
    // Added TooltipProvider
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <Button // Use Shadcn Button
          variant="outline" // Style as outline
          size="sm" // Smaller size
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-1.5" // Use gap for spacing
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <ProjectDetailsCard project={projectDetails} /> {/* Use updated card */}
        <section>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-5 flex items-center border-b pb-3">
            {" "}
            {/* Adjusted size/spacing */}
            <ListBulletIcon className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0" />{" "}
            {/* Adjusted size */}
            Associated Tasks
            <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              ({tasks?.length ?? 0})
            </span>
          </h2>
          {tasks && tasks.length > 0 ? (
            <div className="space-y-5">
              {tasks.map((task) => (
                <TaskCard key={task._id} task={task} /> // Use updated card
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 bg-white rounded-lg border border-dashed border-gray-300 mt-6">
              <ListChecks className="w-10 h-10 mx-auto text-gray-400 mb-3" />{" "}
              {/* Changed icon */}
              <p className="text-gray-500 italic">
                No tasks found associated with this project assignment.
              </p>
            </div>
          )}
        </section>
      </div>
    </TooltipProvider>
  );
}
// --- End Main Content Component ---

// --- Main Page Export (Suspense remains) ---
export default function ProjectTasksDetailsPage() {
  return (
    <Suspense
      fallback={
        // Use simpler fallback for Suspense boundary
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ProjectTasksDetailsContent />
    </Suspense>
  );
}
// --- End Main Page Export ---
