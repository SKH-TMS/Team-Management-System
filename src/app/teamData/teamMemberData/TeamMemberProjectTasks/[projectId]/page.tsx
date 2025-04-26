"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

// Import necessary components and icons
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  ArrowRight,
  ChevronRight,
  ChevronDown,
  BarChart3,
  ListChecks,
  Users,
  Bookmark,
  CalendarClock,
  FileText,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Define or import types ---
// Assuming types are defined here or imported from a shared location like './types'
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
}

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string;
}
// --- End Type Definitions ---

// --- Task Card Component (Placeholder - View Only for Member) ---
interface TaskCardMemberProps {
  task: Task;
  onClick: (task: Task) => void;
  onNavigateToSubtasks: (e: React.MouseEvent, taskId: string) => void;
}

function TaskCardMember({
  task,
  onClick,
  onNavigateToSubtasks,
}: TaskCardMemberProps) {
  const getStatusBadge = () => {
    switch (task.status?.toLowerCase()) {
      case "in progress":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            <span className="hidden xs:inline">In Progress</span>
            <span className="xs:hidden">In Prog</span>
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span className="hidden xs:inline">Completed</span>
            <span className="xs:hidden">Done</span>
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5 flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </Badge>
        );
      case "re assigned":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden xs:inline">Re Assigned</span>
            <span className="xs:hidden">Reassign</span>
          </Badge>
        );
      default:
        return (
          <Badge className="text-xs px-1.5 py-0.5 flex items-center gap-1">
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

  // Calculate if deadline is near or passed
  const isDeadlineNear = () => {
    if (!task.deadline) return false;
    const deadline = new Date(task.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  const isDeadlinePassed = () => {
    if (!task.deadline) return false;
    const deadline = new Date(task.deadline);
    const now = new Date();
    return deadline < now;
  };

  const getDeadlineClass = () => {
    if (isDeadlinePassed() && task.status?.toLowerCase() !== "completed") {
      return "text-red-600 font-medium";
    }
    if (isDeadlineNear() && task.status?.toLowerCase() !== "completed") {
      return "text-amber-600 font-medium";
    }
    return "text-muted-foreground";
  };

  const getDeadlineText = () => {
    if (!task.deadline) return "No deadline";

    if (isDeadlinePassed()) {
      return `Overdue: ${format(new Date(task.deadline), "PP")}`;
    }

    const deadline = new Date(task.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      return `Due soon: ${format(deadline, "PP")}`;
    }

    return `Due: ${format(deadline, "PP")}`;
  };

  const hasSubtasks = task.subTasks && task.subTasks.length > 0;

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-lg shadow-sm hover:shadow-md cursor-pointer border-2 flex flex-col group transform hover:-translate-y-1 transition-all duration-300",
        getBgColor()
      )}
      onClick={() => onClick(task)}
    >
      {hasSubtasks && (
        <div className="absolute top-1 right-1 flex items-center justify-center h-5 w-5 bg-primary/10 rounded-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <ListChecks className="h-3 w-3 text-primary" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Has subtasks</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <CardHeader className="pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2">
            {task.title}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="text-sm space-y-3 pb-3 px-3 sm:px-4 flex-grow">
        <p className="text-muted-foreground line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm">
          {task.description}
        </p>

        <div
          className={cn(
            "flex items-center text-xs sm:text-sm",
            getDeadlineClass()
          )}
        >
          <Calendar className="w-4 h-4 mr-1.5 flex-shrink-0" />
          <span className="truncate">{getDeadlineText()}</span>
        </div>

        {task.gitHubUrl && (
          <div className="text-xs flex items-center text-primary">
            <Github className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">Submission available</span>
          </div>
        )}
      </CardContent>

      {/* Footer with responsive "View Subtasks" link */}
      <CardFooter className="pt-2 pb-3 px-3 sm:px-4 flex justify-end items-center border-t border-dashed border-muted">
        {hasSubtasks && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-auto px-2 py-1 text-xs text-primary font-medium rounded-full",
              "opacity-100 transition-colors duration-200 hover:bg-primary/10"
            )}
            onClick={(e) => onNavigateToSubtasks(e, task.TaskId)}
            aria-label={`View subtasks for ${task.title}`}
          >
            <span className="hidden xs:inline">View Subtasks</span>
            <span className="xs:hidden">Subtasks</span>
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
// --- End Placeholder Task Card ---

export default function TeamMemberProjectTasksPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [submitters, setSubmitters] = useState<Member[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewTaskDetailsData, setViewTaskDetailsData] = useState<Task | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("all");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Fetch Project Tasks for Team Member
  const fetchMemberProjectTasks = useCallback(async () => {
    if (!projectId) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/teamData/teamMemberData/getProjectTasks/${projectId}`,
        { method: "GET" }
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "Failed to fetch project tasks.");
      setTasks(data.tasks || []);
      setProjectTitle(data.title || "Project Tasks");
      setSubmitters(data.submitters || []);
      setMembers(data.members || []);
    } catch (err: any) {
      console.error("Error fetching member project tasks:", err);
      const message = err.message || "Failed to fetch project tasks.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMemberProjectTasks();
  }, [fetchMemberProjectTasks]);

  // --- Event Handlers ---
  const handleOpenDetailsDialog = (task: Task) => {
    setViewTaskDetailsData(task);
  };

  const handleCloseDetailsDialog = () => {
    setViewTaskDetailsData(null);
  };

  const copyToClipboard = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("URL copied to clipboard!");
    });
  };

  // Handler for Subtask Navigation
  const handleNavigateToMemberSubtasks = (
    e: React.MouseEvent,
    taskId: string
  ) => {
    e.stopPropagation();
    router.push(`/teamData/teamMemberData/SubTasks/${taskId}`);
  };

  // --- Status Helper Functions ---
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

  // Filter/Sort Logic
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setActiveTab("all");
  };

  // Project statistics
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

  // Helper function to get filtered tasks by status
  const getTasksByStatus = (status: string) => {
    return tasks.filter(
      (task) => task.status.toLowerCase() === status.toLowerCase()
    );
  };

  // Filter tasks based on search, status filter, and active tab
  const filteredAndSortedTasks = tasks
    .filter((task) => {
      const lowerSearchQuery = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(lowerSearchQuery) ||
        task.description.toLowerCase().includes(lowerSearchQuery);

      const matchesStatus =
        statusFilter === "all" ||
        task.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesTab =
        activeTab === "all" ||
        task.status.toLowerCase() === activeTab.toLowerCase();

      return matchesSearch && matchesStatus && matchesTab;
    })
    .sort((a, b) => {
      // If sorting by deadline
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }

      // Default sorting by status
      const statusOrder: { [key: string]: number } = {
        "Re Assigned": 1,
        Pending: 2,
        "In Progress": 3,
        Completed: 4,
      };
      const orderA = statusOrder[a.status] ?? 99;
      const orderB = statusOrder[b.status] ?? 99;
      return orderA - orderB;
    });

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          {/* Project card skeleton */}
          <Skeleton className="h-40 sm:h-48 w-full rounded-xl" />

          {/* Filters skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Skeleton className="h-8 w-full sm:w-32" />
            <div className="flex gap-2 w-full sm:w-auto">
              <Skeleton className="h-8 w-full sm:w-40" />
              <Skeleton className="h-8 w-20 sm:w-32" />
            </div>
          </div>

          {/* Task grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-36 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
        <Alert variant="destructive" className="shadow-md mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Project Tasks</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
          <Button
            onClick={fetchMemberProjectTasks}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-3 sm:p-6">
        {/* Project Card */}
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
                <CardDescription className="mt-1 text-sm">
                  Tasks and responsibilities for your team
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMemberProjectTasks}
                className="h-8 w-8 rounded-full p-0"
                aria-label="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-2">
            {/* Progress Section */}
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

            {/* Project Stats */}
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
                  {stats.pending}
                </span>
              </div>
            </div>

            {/* Team Members */}
            {members.length > 0 && (
              <div className="bg-white/60 rounded-lg p-3 shadow-sm border border-slate-100 mt-4">
                <h3 className="text-sm font-medium flex items-center gap-1.5 mb-3">
                  <Users className="h-4 w-4 text-muted-foreground" /> Team
                  Members
                </h3>
                <ScrollArea className="w-full pb-2">
                  <div className="flex items-center gap-2">
                    {members.map((member) => (
                      <Tooltip key={member.UserId}>
                        <TooltipTrigger asChild>
                          <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-slate-50 shadow-sm flex-shrink-0">
                            <AvatarImage
                              src={member.profilepic}
                              alt={`${member.firstname} ${member.lastname}`}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {member.firstname[0]}
                              {member.lastname[0]}
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

        {/* Tab & Filters Bar */}
        <div className="mb-6 space-y-4">
          {/* Status Tabs - Scrollable on mobile */}
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex">
              <Tabs>
                <TabsList className="bg-transparent h-auto p-1">
                  <TabsTrigger
                    value="all"
                    onClick={() => setActiveTab("all")}
                    className={cn(
                      "rounded-full text-xs px-3 py-1.5 h-auto data-[state=active]:shadow-sm",
                      activeTab === "all" &&
                        "bg-primary text-primary-foreground"
                    )}
                  >
                    All Tasks
                    <Badge className="ml-2 text-[10px] h-4 min-w-4 bg-primary-foreground text-primary">
                      {tasks.length}
                    </Badge>
                  </TabsTrigger>

                  <TabsTrigger
                    value="pending"
                    onClick={() => setActiveTab("pending")}
                    className={cn(
                      "rounded-full text-xs px-3 py-1.5 h-auto data-[state=active]:shadow-sm",
                      activeTab === "pending" && "bg-slate-200 text-slate-900"
                    )}
                  >
                    Pending
                    <Badge className="ml-2 text-[10px] h-4 min-w-4 bg-slate-700 text-white">
                      {getTasksByStatus("pending").length}
                    </Badge>
                  </TabsTrigger>

                  <TabsTrigger
                    value="in progress"
                    onClick={() => setActiveTab("in progress")}
                    className={cn(
                      "rounded-full text-xs px-3 py-1.5 h-auto data-[state=active]:shadow-sm",
                      activeTab === "in progress" && "bg-blue-100 text-blue-900"
                    )}
                  >
                    In Progress
                    <Badge className="ml-2 text-[10px] h-4 min-w-4 bg-blue-600 text-white">
                      {getTasksByStatus("in progress").length}
                    </Badge>
                  </TabsTrigger>

                  <TabsTrigger
                    value="completed"
                    onClick={() => setActiveTab("completed")}
                    className={cn(
                      "rounded-full text-xs px-3 py-1.5 h-auto data-[state=active]:shadow-sm",
                      activeTab === "completed" && "bg-green-100 text-green-900"
                    )}
                  >
                    Completed
                    <Badge className="ml-2 text-[10px] h-4 min-w-4 bg-green-600 text-white">
                      {getTasksByStatus("completed").length}
                    </Badge>
                  </TabsTrigger>

                  {stats.reassigned > 0 && (
                    <TabsTrigger
                      value="re assigned"
                      onClick={() => setActiveTab("re assigned")}
                      className={cn(
                        "rounded-full text-xs px-3 py-1.5 h-auto data-[state=active]:shadow-sm",
                        activeTab === "re assigned" &&
                          "bg-amber-100 text-amber-900"
                      )}
                    >
                      Re-Assigned
                      <Badge className="ml-2 text-[10px] h-4 min-w-4 bg-amber-600 text-white">
                        {getTasksByStatus("re assigned").length}
                      </Badge>
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Mobile Filters Toggle */}
          <div className="flex items-center justify-between mb-4 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                Filters & Search
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  filtersExpanded && "rotate-180"
                )}
              />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="ml-2 flex-shrink-0 w-10 h-8"
              aria-label="Toggle view mode"
            >
              {viewMode === "grid" ? (
                <LayoutList className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Filters/View Options */}
          <div
            className={cn(
              "gap-2",
              filtersExpanded || "sm:flex",
              filtersExpanded ? "flex" : "hidden",
              "flex-col sm:flex-row justify-between items-stretch sm:items-center"
            )}
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full sm:w-56 lg:w-64 h-9 border-slate-200 focus:border-primary"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-auto md:w-[160px] h-9 text-xs sm:text-sm border-slate-200">
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
                activeTab !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 sm:w-9 flex-shrink-0 border-slate-200"
                >
                  <X className="h-4 w-4 sm:mr-0 mr-2" />
                  <span className="sm:hidden">Clear Filters</span>
                </Button>
              )}
            </div>

            {/* View toggle - Desktop only */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="h-9 w-9 flex-shrink-0 ml-auto hidden sm:flex border-slate-200"
              aria-label="Toggle view mode"
            >
              {viewMode === "grid" ? (
                <LayoutList className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Task List/Grid */}
        {tasks.length === 0 ? (
          <div className="text-center py-8 sm:py-12 border border-dashed rounded-lg bg-slate-50 mt-4 sm:mt-6">
            <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4 opacity-70" />
            <h3 className="text-lg sm:text-xl font-medium mb-2">
              No Tasks Assigned
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto px-4 text-sm sm:text-base">
              No tasks have been assigned to your team for this project yet.
            </p>
          </div>
        ) : filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-8 sm:py-12 border border-dashed rounded-lg bg-slate-50 mt-4 sm:mt-6">
            <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4 opacity-70" />
            <h3 className="text-lg sm:text-xl font-medium mb-2">
              No Matching Tasks
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto px-4 text-sm sm:text-base">
              Try adjusting your search or filter criteria.
            </p>
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" /> Clear Filters
            </Button>
          </div>
        ) : (
          <div
            className={`grid gap-3 sm:gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1 max-w-4xl mx-auto"
            }`}
          >
            {viewMode === "list" ? (
              // List view
              <Card className="overflow-hidden border-slate-200">
                <ScrollArea className="h-[calc(100vh-400px)] min-h-[300px]">
                  <div className="space-y-1 p-1">
                    {filteredAndSortedTasks.map((task) => (
                      <div
                        key={task.TaskId}
                        className={cn(
                          "p-2 rounded-md hover:bg-muted/50 cursor-pointer flex justify-between items-center gap-3",
                          task.status.toLowerCase() === "completed" &&
                            "bg-green-50/50",
                          task.status.toLowerCase() === "in progress" &&
                            "bg-blue-50/50",
                          task.status.toLowerCase() === "re assigned" &&
                            "bg-amber-50/50"
                        )}
                        onClick={() => handleOpenDetailsDialog(task)}
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate pr-2">
                            {task.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs px-1.5 py-0 h-5 border-l-2",
                                getStatusColor(task.status)
                              )}
                            >
                              {getStatusIcon(task.status)}
                              <span className="ml-1">{task.status}</span>
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center">
                              <CalendarClock className="h-3 w-3 mr-1" />
                              {format(new Date(task.deadline), "PP")}
                            </span>
                          </div>
                        </div>

                        {task.subTasks && task.subTasks.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 rounded-full text-xs text-primary"
                            onClick={(e) =>
                              handleNavigateToMemberSubtasks(e, task.TaskId)
                            }
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <ScrollBar />
                </ScrollArea>
              </Card>
            ) : (
              // Grid view
              filteredAndSortedTasks.map((task) => (
                <TaskCardMember
                  key={task.TaskId}
                  task={task}
                  onClick={handleOpenDetailsDialog}
                  onNavigateToSubtasks={handleNavigateToMemberSubtasks}
                />
              ))
            )}
          </div>
        )}

        {/* --- Task Details Dialog (View Only) --- */}
        <Dialog
          open={!!viewTaskDetailsData}
          onOpenChange={(open) => !open && handleCloseDetailsDialog()}
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
                Detailed information about this task
              </DialogDescription>
            </DialogHeader>
            {viewTaskDetailsData && (
              <div className="space-y-4 py-4 text-sm">
                {/* Core Details */}
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
                </div>

                <Separator className="my-2" />

                <div className="space-y-1 bg-slate-50 p-3 rounded-md">
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

                {/* Submission Details (If available) */}
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
                          <Label className="flex items-center text-xs font-medium text-muted-foreground">
                            <User className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                            Submitted By
                          </Label>
                          {viewTaskDetailsData.submittedby &&
                          viewTaskDetailsData.submittedby !==
                            "Not-submitted" ? (
                            (() => {
                              const s = submitters.find(
                                (sub: Member) =>
                                  sub.UserId ===
                                  viewTaskDetailsData?.submittedby
                              );
                              return s ? (
                                <div className="flex items-center mt-1 flex-wrap">
                                  <Avatar className="h-6 w-6 mr-2 flex-shrink-0">
                                    <AvatarImage src={s.profilepic} />
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                      {s.firstname[0]}
                                      {s.lastname[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {s.firstname} {s.lastname}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {s.email}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm truncate">
                                  User ID: {viewTaskDetailsData.submittedby}
                                </p>
                              );
                            })()
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              N/A
                            </p>
                          )}
                        </div>

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

                {/* Subtasks section */}
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
                            handleNavigateToMemberSubtasks(
                              e,
                              viewTaskDetailsData.TaskId
                            )
                          }
                          className="w-full justify-between"
                        >
                          <span>
                            View {viewTaskDetailsData.subTasks.length} Subtasks
                          </span>
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        </Button>
                      </div>
                    </>
                  )}
              </div>
            )}
            <DialogFooter className="pt-4 mt-2 border-t flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleCloseDetailsDialog}
                className="flex-1 sm:flex-none"
              >
                Close
              </Button>
              {viewTaskDetailsData?.subTasks &&
                viewTaskDetailsData.subTasks.length > 0 && (
                  <Button
                    onClick={(e) =>
                      handleNavigateToMemberSubtasks(
                        e,
                        viewTaskDetailsData.TaskId
                      )
                    }
                    className="gap-1 flex-1 sm:flex-none"
                  >
                    <span className="truncate">View Subtasks</span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  </Button>
                )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
