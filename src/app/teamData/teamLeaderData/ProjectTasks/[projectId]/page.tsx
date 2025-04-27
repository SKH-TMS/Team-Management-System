// src/app/teamData/teamLeaderData/ProjectTasks/[projectId]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

// Import necessary components and icons (Keep all existing imports from Leader page)
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionAlias,
  AlertDialogFooter as AlertDialogFooterAlias,
  AlertDialogHeader as AlertDialogHeaderAlias,
  AlertDialogTitle as AlertDialogTitleAlias,
} from "@/components/ui/alert-dialog"; // Keep Alias if used
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // Keep Progress
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"; // Keep ScrollArea
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertCircle,
  Briefcase,
  LayoutGrid,
  LayoutList,
  Search,
  Filter,
  X,
  Loader2,
  ArrowLeft,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  Info,
  Github,
  Copy,
  MessageSquare,
  RefreshCw,
  ChevronRight, // Keep if used by original leader card/dialog
  ListChecks, // Keep if used by original leader card/dialog
  Users,
  Bookmark, // Keep if used by original leader card/dialog
  FileText, // Keep if used by original leader card/dialog
  ExternalLink, // Keep if used by original leader card/dialog
  GitBranch, // Keep if used by original leader card
  Send, // Keep if used by original leader card
  Eye,
  AlertTriangle, // Keep if used by original leader card
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Define or import types (Keep Leader's types) ---
interface Task {
  TaskId: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  gitHubUrl?: string;
  context?: string;
  submittedby?: string;
  subTasks?: string[];
  assignedTeamMembers?: string[]; // Keep this if leader uses it
}

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
  profilepic?: string;
}

// --- Task Card Component (Keep Leader's Original Card As Is) ---
interface TaskCardTeamLeadProps {
  task: Task;
  onClick: () => void;
  onOpenSubmitDialog: (e: React.MouseEvent, task: Task) => void; // Keep original props
  onNavigateToSubtasks: (e: React.MouseEvent, taskId: string) => void;
  onViewCompletedTask: (e: React.MouseEvent, task: Task) => void;
  // NOTE: Add onEditClick if it should be here based on your actual component
  // onEditClick: (e: React.MouseEvent, taskId: string) => void;
}

function TaskCardTeamLead({
  task,
  onClick,
  onOpenSubmitDialog,
  onNavigateToSubtasks,
  onViewCompletedTask,
}: // onEditClick, // Add if needed
TaskCardTeamLeadProps) {
  // --- Keep Leader's Original Card Helpers & Structure ---
  const getStatusBadge = () => {
    switch (task.status?.toLowerCase()) {
      case "in progress":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5"
          >
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "re assigned":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Re Assigned
          </Badge>
        );
      default:
        return (
          <Badge className="text-xs px-1.5 py-0.5">
            {task.status || "Unknown"}
          </Badge>
        );
    }
  };
  const getBgColor = () => {
    switch (task.status?.toLowerCase()) {
      case "in progress":
        return "bg-blue-50 border-blue-200";
      case "completed":
        return "bg-green-50 border-green-200";
      case "pending":
        return "bg-gray-50 border-gray-200";
      case "re assigned":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-card border";
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-lg shadow hover:shadow-lg sm:hover:shadow-2xl transform transition-all duration-300 sm:hover:-translate-y-1 cursor-pointer border-l-4",
        getBgColor()
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base sm:text-lg font-medium line-clamp-2 break-words">
            {task.title}
          </CardTitle>
          <div className="flex-shrink-0">{getStatusBadge()}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-3 text-sm px-4 sm:px-6">
        <p className="text-muted-foreground line-clamp-2 sm:line-clamp-3">
          {task.description}
        </p>
        <div className="flex items-center text-xs text-muted-foreground pt-1">
          <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
          <span className="truncate">
            Due:{" "}
            {task.deadline ? format(new Date(task.deadline), "PPp") : "N/A"}
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-3 flex flex-wrap justify-end items-center gap-2 px-4 sm:px-6">
        {task.status === "Completed" ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-2 h-7"
              onClick={(e) => {
                e.stopPropagation();
                onViewCompletedTask(e, task);
              }}
            >
              <Eye className="w-3.5 h-3.5 mr-1" /> View Submission
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-2 h-7"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToSubtasks(e, task.TaskId);
              }}
            >
              <GitBranch className="w-3.5 h-3.5 mr-1" /> See Subtasks
            </Button>
          </>
        ) : (
          <>
            {(task.status === "Pending" || task.status === "Re Assigned") && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-2 h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToSubtasks(e, task.TaskId);
                }}
              >
                <GitBranch className="w-3.5 h-3.5 mr-1" /> Manage Subtasks
              </Button>
            )}
            {(task.status === "In Progress" || task.status === "Completed") && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-2 h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToSubtasks(e, task.TaskId);
                }}
              >
                <GitBranch className="w-3.5 h-3.5 mr-1" /> Subtasks
              </Button>
            )}
            {(task.status === "Pending" ||
              task.status === "Re Assigned" ||
              task.status === "In Progress") && (
              <Button
                variant="default"
                size="sm"
                className="text-xs px-2 h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSubmitDialog(e, task);
                }}
              >
                <Send className="w-3.5 h-3.5 mr-1" />{" "}
                {task.status === "In Progress" ? "Re-Submit" : "Submit Task"}
              </Button>
            )}
          </>
        )}
        {/* Add Edit button here if it was part of the original leader card */}
        {/* <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => onEditClick(e, task.TaskId)}><FileEdit className="h-4 w-4" /></Button> */}
      </CardFooter>
    </Card>
  );
}
// --- End Task Card Component ---

export default function TeamLeaderProjectTasksPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();

  // State (Keep all existing state)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<Member[]>([]); // Added for project card
  const [submitters, setSubmitters] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<{ UserId: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all"); // Keep leader's assignee filter
  const [submitTaskData, setSubmitTaskData] = useState<Task | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionContext, setSubmissionContext] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewCompletedTaskData, setViewCompletedTaskData] =
    useState<Task | null>(null);
  const [viewTaskDetailsData, setViewTaskDetailsData] = useState<Task | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Task | null>(null); // Keep delete state
  const [isDeleting, setIsDeleting] = useState(false); // Keep delete state
  const [parentTask, setParentTask] = useState<Task | null>(null); // Added state for project description

  // Fetch Project Tasks for Team Leader (Keep existing fetch logic, ensure it sets teamMembers and parentTask)
  const fetchTeamLeadProjectTasks = useCallback(async () => {
    if (!projectId) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/teamData/teamLeaderData/getProjectTasks/${projectId}`,
        { method: "GET" }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch project tasks for your team."
        );
      }
      setTasks(data.tasks || []);
      setProjectTitle(data.title || "Project Tasks");
      setTeamMembers(data.members || []); // Make sure API returns members
      setSubmitters(data.submitters || []);
      setCurrentUser(data.currentUser || null);
      // Assuming API returns project description in 'parentTask' or similar
      setParentTask(data.parentTask || { title: data.title }); // Set parentTask for description
    } catch (err: any) {
      console.error("Error fetching team project tasks:", err);
      const message = err.message || "Failed to fetch project tasks.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTeamLeadProjectTasks();
  }, [fetchTeamLeadProjectTasks]);

  // --- Event Handlers (Keep all existing handlers) ---
  const copyToClipboard = (text: string | undefined) => {
    // Added undefined check
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("URL copied to clipboard!");
    });
  };
  const handleOpenSubmitDialog = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setSubmitTaskData(task);
    setSubmissionUrl(task.gitHubUrl || "");
    setSubmissionContext(task.context || "");
  };
  const handleCloseSubmitDialog = () => {
    setSubmitTaskData(null);
    setSubmissionUrl("");
    setSubmissionContext("");
    setIsSubmitting(false);
  };
  const handleSubmitTask = async () => {
    if (!submitTaskData || !submissionUrl.trim()) {
      toast.error("GitHub URL is required for submission.");
      return;
    }
    try {
      new URL(submissionUrl);
    } catch (_) {
      toast.error("Please enter a valid GitHub URL.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/teamData/teamLeaderData/submitTask/${submitTaskData.TaskId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gitHubUrl: submissionUrl.trim(),
            context: submissionContext.trim(),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "Failed to submit task.");
      toast.success(`Task '${submitTaskData.title}' submitted successfully!`);
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.TaskId === submitTaskData.TaskId
            ? {
                ...task,
                status: "In Progress",
                gitHubUrl: submissionUrl.trim(),
                context: submissionContext.trim(),
                submittedby: currentUser?.UserId,
              }
            : task
        )
      );
      handleCloseSubmitDialog();
    } catch (error: any) {
      console.error("Error submitting task:", error);
      toast.error(error.message || "Failed to submit task.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleNavigateToSubtasks = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    router.push(`/teamData/teamLeaderData/SubTasks/${taskId}`);
  };
  const handleViewCompletedTask = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setViewCompletedTaskData(task);
  };
  const handleCloseViewCompletedDialog = () => {
    setViewCompletedTaskData(null);
  };
  const handleCardClick = (task: Task) => {
    setViewTaskDetailsData(task);
  };
  const handleCloseTaskDetailsDialog = () => {
    setViewTaskDetailsData(null);
  };

  // Add Edit/Delete handlers if they existed in the original leader file
  const handleNavigateToEditTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    router.push(`/teamData/teamLeaderData/UpdateTask/${taskId}`); // Assuming this route exists
  };
  const handleOpenDeleteConfirm = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setShowDeleteConfirm(task);
  };
  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(null);
  };

  // --- Helper Functions (Keep existing helpers + add stats helpers) ---
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "re assigned":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "in progress":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-3 w-3" />;
      case "re assigned":
        return <RefreshCw className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };
  const getProjectStatistics = () => {
    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.status.toLowerCase() === "completed"
    ).length;
    const inProgress = tasks.filter(
      (task) => task.status.toLowerCase() === "in progress"
    ).length;
    const pending = tasks.filter(
      (task) => task.status.toLowerCase() === "pending"
    ).length;
    const reassigned = tasks.filter(
      (task) => task.status.toLowerCase() === "re assigned"
    ).length;
    const completionPercentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    const tasksWithSubtasks = tasks.filter(
      (task) => task.subTasks && task.subTasks.length > 0
    ).length;
    return {
      total,
      completed,
      inProgress,
      pending,
      reassigned,
      completionPercentage,
      tasksWithSubtasks,
    };
  };
  const stats = getProjectStatistics();
  const getInitials = (firstname?: string, lastname?: string) => {
    if (!firstname) return "?";
    if (!lastname) return firstname.charAt(0).toUpperCase();
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };

  // Filter/Sort Logic (Keep existing logic including assignee filter)
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setAssigneeFilter("all");
  };
  const filteredAndSortedTasks = tasks
    .filter((task) => {
      const lowerSearchQuery = searchQuery.toLowerCase();
      const matchesSearch =
        !lowerSearchQuery ||
        task.title.toLowerCase().includes(lowerSearchQuery) ||
        task.description.toLowerCase().includes(lowerSearchQuery);
      const matchesStatus =
        statusFilter === "all" ||
        task.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesAssignee =
        assigneeFilter === "all" ||
        (task.assignedTeamMembers &&
          task.assignedTeamMembers.includes(assigneeFilter));
      return matchesSearch && matchesStatus && matchesAssignee;
    })
    .sort((a, b) => {
      const statusOrder: { [key: string]: number } = {
        "Re Assigned": 1,
        Pending: 2,
        "In Progress": 3,
        Completed: 4,
      };
      const orderA = statusOrder[a.status] ?? 99;
      const orderB = statusOrder[b.status] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      if (a.deadline && b.deadline)
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return 0;
    });

  // Helper to get assignees for a specific task (Keep this)
  const getAssigneesForTask = useCallback(
    (task: Task): Member[] => {
      if (!task.assignedTeamMembers || task.assignedTeamMembers.length === 0)
        return [];
      // Use the teamMembers state fetched for the leader page
      return teamMembers.filter((member) =>
        task.assignedTeamMembers?.includes(member.UserId)
      );
    },
    [teamMembers]
  );

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* --- ADDED SKELETON FOR PROJECT CARD --- */}
        <Skeleton className="h-40 sm:h-48 w-full rounded-xl mb-6" />
        {/* --- END ADDED SKELETON --- */}
        <div className="animate-pulse space-y-6">
          <Skeleton className="h-8 w-1/2 mx-auto" />
          <div className="flex justify-end">
            <Skeleton className="h-9 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Tasks</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {" "}
      {/* Added TooltipProvider */}
      <div className="container mx-auto p-4 sm:p-6">
        {" "}
        {/* Use consistent padding */}
        {/* --- ADDED PROJECT CARD --- */}
        {/* Conditional rendering based on loading/error/data */}
        {loading ? (
          <Skeleton className="h-40 sm:h-48 w-full rounded-xl mb-6 sm:mb-8" />
        ) : error ? (
          <Alert variant="destructive" className="mb-6 sm:mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Project Info</AlertTitle>
            <AlertDescription>Could not load project details.</AlertDescription>
          </Alert>
        ) : (
          // Render card only if not loading and no error
          <Card className="mb-6 sm:mb-8 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 shadow-md border-0">
            <CardHeader className="p-4 sm:p-6 pb-0 sm:pb-3">
              <div className="flex items-start sm:items-center justify-between mb-2 flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="h-8 w-8 rounded-full p-0 mr-2"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-primary">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary/80 flex-shrink-0" />
                    <span className="truncate">
                      {projectTitle || `Project ${projectId}`}
                    </span>
                  </CardTitle>
                  {/* Use parentTask.description if available */}
                  {parentTask?.description && (
                    <CardDescription className="mt-1 text-sm">
                      {parentTask.description}
                    </CardDescription>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTeamLeadProjectTasks}
                  className="h-8 w-8 rounded-full p-0"
                  aria-label="Refresh data"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2">
              <div className="mb-4 sm:mb-6">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Project Completion
                  </span>
                  <span className="text-xs sm:text-sm font-medium">
                    {stats.completionPercentage}%
                  </span>
                </div>
                <Progress
                  value={stats.completionPercentage}
                  className="h-2 sm:h-2.5 bg-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 mb-4">
                <div className="bg-white/60 rounded-lg p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <ListChecks className="h-3 w-3" /> Total Tasks
                  </span>
                  <span className="text-lg sm:text-2xl font-semibold">
                    {stats.total}
                  </span>
                </div>
                <div className="bg-white/60 rounded-lg p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <CheckCircle2 className="h-3 w-3" /> Completed
                  </span>
                  <span className="text-lg sm:text-2xl font-semibold text-green-600">
                    {stats.completed}
                  </span>
                </div>
                <div className="bg-white/60 rounded-lg p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3" /> In Progress
                  </span>
                  <span className="text-lg sm:text-2xl font-semibold text-blue-600">
                    {stats.inProgress}
                  </span>
                </div>
                <div className="bg-white/60 rounded-lg p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <AlertCircle className="h-3 w-3" /> Pending
                  </span>
                  <span className="text-lg sm:text-2xl font-semibold text-slate-600">
                    {stats.pending + stats.reassigned}
                  </span>
                </div>
              </div>
              {teamMembers.length > 0 && (
                <div className="bg-white/60 rounded-lg p-3 shadow-sm border border-slate-100 mt-4">
                  <h3 className="text-sm font-medium flex items-center gap-1.5 mb-3">
                    <Users className="h-4 w-4 text-muted-foreground" /> Team
                    Members ({teamMembers.length})
                  </h3>
                  <ScrollArea className="w-full pb-2">
                    <div className="flex items-center gap-2">
                      {teamMembers.map((member) => (
                        <Tooltip key={member.UserId}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-slate-50 shadow-sm flex-shrink-0">
                              <AvatarImage
                                src={member.profilepic}
                                alt={`${member.firstname} ${member.lastname}`}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(member.firstname, member.lastname)}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="font-medium">
                                {member.firstname} {member.lastname}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.email}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {/* --- END ADDED PROJECT CARD --- */}
        {/* --- LEADER'S ORIGINAL CONTENT BELOW (Filters, Grid/List, Dialogs) --- */}
        {/* Filters/View Options (Leader's Original Structure) */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-end items-stretch sm:items-center gap-2 mb-6">
          {/* Add Create Task Button Here if it existed in original leader file */}
          {/* <Button onClick={handleNavigateToCreateTask} size="sm" className="gap-1.5"><PlusCircle className="h-4 w-4" /> Create Task</Button> */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full sm:w-48 lg:w-64 h-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-auto md:w-[160px] h-9 text-xs sm:text-sm">
                <div className="flex items-center">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Filter Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="re assigned">Re-Assigned</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery ||
              statusFilter !== "all" ||
              assigneeFilter !== "all") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                className="h-9 w-9 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="h-9 w-9 flex-shrink-0"
            >
              {viewMode === "grid" ? (
                <LayoutList className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {/* Task List/Grid (Leader's Original Structure & Card) */}
        {tasks.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card mt-6">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No Tasks Assigned</h3>
            <p className="text-muted-foreground mb-6">
              There are currently no tasks assigned to your team for this
              project.
            </p>
            {/* Add Create Task Button Here if it existed in original leader file */}
            {/* <Button onClick={handleNavigateToCreateTask} className="gap-2"><PlusCircle className="h-4 w-4" /> Create First Task</Button> */}
          </div>
        ) : filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card mt-6">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No Matching Tasks</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filter criteria.
            </p>
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <X className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
          </div>
        ) : (
          <div
            className={`grid gap-4 sm:gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}
          >
            {filteredAndSortedTasks.map((task) => (
              <TaskCardTeamLead // Use the original leader card component
                key={task.TaskId}
                task={task}
                onClick={() => handleCardClick(task)}
                onOpenSubmitDialog={handleOpenSubmitDialog}
                onNavigateToSubtasks={handleNavigateToSubtasks}
                onViewCompletedTask={handleViewCompletedTask}
                // Pass onEditClick if defined in props
                // onEditClick={handleNavigateToEditTask}
              />
            ))}
          </div>
        )}
        {/* --- Modals (Keep Leader's Original Modals) --- */}
        {/* Submit Task Dialog */}
        <Dialog
          open={!!submitTaskData}
          onOpenChange={(open) => !open && handleCloseSubmitDialog()}
        >
          {/* ... Keep original Submit Task Dialog content ... */}
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Submit Task: {submitTaskData?.title}</DialogTitle>
              <DialogDescription>
                Provide the final GitHub repository URL and any relevant context
                for this task.
                {submitTaskData?.status === "In Progress" && (
                  <span className="text-amber-600 block mt-1">
                    {" "}
                    Note: Re-submitting will overwrite previous submission
                    details.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="github-url" className="flex items-center">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub URL*
                </Label>
                <Input
                  id="github-url"
                  placeholder="https://github.com/..."
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="context" className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Context/Explanation (Optional)
                </Label>
                <Textarea
                  id="context"
                  placeholder="Add any notes or context about your submission..."
                  value={submissionContext}
                  onChange={(e) => setSubmissionContext(e.target.value)}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseSubmitDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitTask}
                disabled={isSubmitting || !submissionUrl.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Submit Task
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* View Completed Task Dialog */}
        <Dialog
          open={!!viewCompletedTaskData}
          onOpenChange={(open) => !open && handleCloseViewCompletedDialog()}
        >
          {/* ... Keep original View Completed Task Dialog content ... */}
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                {viewCompletedTaskData?.title || "Completed Task"}
                <Badge
                  variant="secondary"
                  className="ml-auto bg-green-100 text-green-800"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                </Badge>
              </DialogTitle>
            </DialogHeader>
            {viewCompletedTaskData && (
              <div className="space-y-4 py-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  <div className="space-y-1">
                    <Label className="flex items-center text-xs font-medium text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" /> Deadline
                    </Label>
                    <p>
                      {format(new Date(viewCompletedTaskData.deadline), "PPPp")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="flex items-center text-xs font-medium text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 mr-1.5" /> Last Updated
                    </Label>
                    <p>
                      {format(new Date(viewCompletedTaskData.updatedAt), "PPp")}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Description
                  </Label>
                  <Textarea
                    value={viewCompletedTaskData.description}
                    readOnly
                    className="min-h-[80px] bg-muted/30 border-none"
                  />
                </div>
                <Separator />
                <h4 className="text-base font-semibold pt-2">
                  Submission Details
                </h4>
                <div className="space-y-3 pl-2 border-l-2">
                  <div className="space-y-1"></div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="view-github-url"
                      className="flex items-center text-xs font-medium text-muted-foreground"
                    >
                      <Github className="w-3.5 h-3.5 mr-1.5" /> GitHub URL
                    </Label>
                    {viewCompletedTaskData.gitHubUrl ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          id="view-github-url"
                          value={viewCompletedTaskData.gitHubUrl}
                          readOnly
                          className="font-mono text-xs h-8 flex-1 bg-muted/30 border-none"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() =>
                            copyToClipboard(
                              viewCompletedTaskData?.gitHubUrl || ""
                            )
                          }
                          aria-label="Copy GitHub URL"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No URL provided.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="view-context"
                      className="flex items-center text-xs font-medium text-muted-foreground"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />{" "}
                      Explanation/Context
                    </Label>
                    <Textarea
                      id="view-context"
                      value={
                        viewCompletedTaskData.context ||
                        "No explanation provided."
                      }
                      readOnly
                      className="min-h-[80px] text-sm bg-muted/30 border-none"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="pt-4 mt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCloseViewCompletedDialog}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* General Task Details Dialog (Keep Leader's Original) */}
        <Dialog
          open={!!viewTaskDetailsData}
          onOpenChange={(open) => !open && handleCloseTaskDetailsDialog()}
        >
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="truncate">
                  {viewTaskDetailsData?.title || "Task Details"}
                </span>
                {viewTaskDetailsData?.status && (
                  <Badge
                    variant="outline"
                    className={`ml-auto border border-l-4 whitespace-nowrap ${getStatusColor(viewTaskDetailsData.status)}`}
                  >
                    {getStatusIcon(viewTaskDetailsData.status)}
                    <span className="ml-1">{viewTaskDetailsData.status}</span>
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Detailed information about this task.
              </DialogDescription>
            </DialogHeader>
            {viewTaskDetailsData && (
              <div className="space-y-4 py-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  <div className="space-y-1">
                    <Label className="flex items-center text-xs font-medium text-muted-foreground">
                      <Briefcase className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                      Project
                    </Label>
                    <p className="font-medium text-primary truncate">
                      {projectTitle || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="flex items-center text-xs font-medium text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                      Deadline
                    </Label>
                    <p
                      className={cn(
                        "font-medium flex flex-wrap items-baseline",
                        new Date(viewTaskDetailsData.deadline) < new Date() &&
                          viewTaskDetailsData.status.toLowerCase() !==
                            "completed" &&
                          "text-red-600"
                      )}
                    >
                      <span className="truncate mr-1">
                        {format(new Date(viewTaskDetailsData.deadline), "PPP")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(viewTaskDetailsData.deadline), "p")}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="flex items-center text-xs font-medium text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                      Created
                    </Label>
                    <p className="flex flex-wrap items-baseline">
                      <span className="truncate mr-1">
                        {format(new Date(viewTaskDetailsData.createdAt), "PP")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(viewTaskDetailsData.createdAt), "p")}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="flex items-center text-xs font-medium text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                      Last Updated
                    </Label>
                    <p className="flex flex-wrap items-baseline">
                      <span className="truncate mr-1">
                        {format(new Date(viewTaskDetailsData.updatedAt), "PP")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(viewTaskDetailsData.updatedAt), "p")}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="flex items-center text-xs font-medium text-muted-foreground">
                      <Info className="w-3.5 h-3.5 mr-1.5" /> Status
                    </Label>
                    <p>{viewTaskDetailsData.status}</p>
                  </div>
                </div>
                <Separator className="my-2" />

                <Separator className="my-2" />
                <div className="bg-slate-50 p-3 rounded-md">
                  <Label
                    htmlFor="details-description"
                    className="text-xs font-medium text-muted-foreground flex items-center"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                    Description
                  </Label>
                  <div className="text-sm mt-1 whitespace-pre-line">
                    {viewTaskDetailsData.description ||
                      "No description provided."}
                  </div>
                </div>
                {(viewTaskDetailsData.submittedby &&
                  viewTaskDetailsData.submittedby !== "Not-submitted") ||
                viewTaskDetailsData.status === "Completed" ||
                viewTaskDetailsData.status === "Re Assigned" ? (
                  <>
                    <Separator className="my-2" />
                    <div className="bg-slate-50 p-3 sm:p-4 rounded-md">
                      <h4 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-1.5">
                        <Bookmark
                          className={cn(
                            "w-4 h-4 flex-shrink-0",
                            viewTaskDetailsData.status === "Re Assigned"
                              ? "text-amber-500"
                              : "text-green-500"
                          )}
                        />
                        {viewTaskDetailsData.status === "Re Assigned"
                          ? "Previous Submission / Feedback"
                          : "Submission Details"}
                      </h4>
                      <div className="space-y-3 pl-3 border-l-2 border-slate-200">
                        <div className="space-y-1">
                          <Label
                            htmlFor="details-github-url"
                            className="flex items-center text-xs font-medium text-muted-foreground"
                          >
                            <Github className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                            GitHub URL
                          </Label>
                          {viewTaskDetailsData.gitHubUrl ? (
                            <div className="flex items-center space-x-2 bg-white p-2 rounded border border-slate-200 mt-1">
                              <a
                                href={viewTaskDetailsData.gitHubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm truncate flex-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {viewTaskDetailsData.gitHubUrl}
                              </a>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-full flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(
                                    viewTaskDetailsData?.gitHubUrl
                                  );
                                }}
                                aria-label="Copy GitHub URL"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-full flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(
                                    viewTaskDetailsData.gitHubUrl,
                                    "_blank"
                                  );
                                }}
                                aria-label="Open GitHub URL"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              No URL provided
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor="details-context"
                            className="flex items-center text-xs font-medium text-muted-foreground"
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                            {viewTaskDetailsData.status === "Re Assigned"
                              ? "Feedback Provided"
                              : "Explanation/Context"}
                          </Label>
                          {viewTaskDetailsData.context ? (
                            <div
                              className={cn(
                                "bg-white p-3 rounded border border-slate-200 mt-1 text-sm whitespace-pre-line",
                                viewTaskDetailsData.status === "Re Assigned" &&
                                  "border-l-4 border-amber-400"
                              )}
                            >
                              {viewTaskDetailsData.context}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              {viewTaskDetailsData.status === "Re Assigned"
                                ? "No feedback recorded"
                                : "No explanation provided"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
                {viewTaskDetailsData.subTasks &&
                  viewTaskDetailsData.subTasks.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <div className="bg-slate-50 p-3 sm:p-4 rounded-md">
                        <h4 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-1.5">
                          <ListChecks className="w-4 h-4 text-primary flex-shrink-0" />{" "}
                          Subtasks
                        </h4>
                        <Button
                          onClick={(e) =>
                            handleNavigateToSubtasks(
                              e,
                              viewTaskDetailsData.TaskId
                            )
                          }
                          className="w-full justify-between"
                        >
                          <span>
                            Manage {viewTaskDetailsData.subTasks.length}{" "}
                            Subtasks
                          </span>
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        </Button>
                      </div>
                    </>
                  )}
              </div>
            )}
            {/* LEADER ACTION FOOTER (Keep Original) */}
            <DialogFooter className="pt-4 mt-2 border-t flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleCloseTaskDetailsDialog}>
                {" "}
                Close{" "}
              </Button>
              {viewTaskDetailsData?.subTasks &&
                viewTaskDetailsData.subTasks.length > 0 && (
                  <Button
                    onClick={(e) =>
                      handleNavigateToSubtasks(e, viewTaskDetailsData.TaskId)
                    }
                    className="gap-1"
                  >
                    <span className="truncate">Manage Subtasks</span>{" "}
                    <ListChecks className="h-4 w-4 flex-shrink-0" />
                  </Button>
                )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* --- Confirmation Dialog for DELETE (Keep Leader's Original) --- */}
        <AlertDialog
          open={!!showDeleteConfirm}
          onOpenChange={(open) => !open && handleCloseDeleteConfirm()}
        >
          <AlertDialogContent>
            <AlertDialogHeaderAlias>
              <AlertDialogTitleAlias className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />{" "}
                Confirm Task Deletion
              </AlertDialogTitleAlias>
              <AlertDialogDescriptionAlias>
                Are you sure you want to permanently delete the task "
                {showDeleteConfirm?.title}"? This will also delete all
                associated subtasks and cannot be undone.
              </AlertDialogDescriptionAlias>
            </AlertDialogHeaderAlias>
            <AlertDialogFooterAlias>
              <AlertDialogCancel
                onClick={handleCloseDeleteConfirm}
                disabled={isDeleting}
              >
                Cancel
              </AlertDialogCancel>
            </AlertDialogFooterAlias>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
