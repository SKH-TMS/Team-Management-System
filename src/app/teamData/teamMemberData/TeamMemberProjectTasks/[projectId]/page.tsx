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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        "relative overflow-hidden rounded-lg shadow hover:shadow-2xl cursor-pointer border flex flex-col group border-l-4 transform hover:-translate-y-1 transition-all duration-300",
        getBgColor()
      )}
      onClick={() => onClick(task)} // Main card click opens details
    >
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
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 mr-1.5" />
          Due: {task.deadline ? format(new Date(task.deadline), "PP") : "N/A"}
        </div>
      </CardContent>
      {/* Footer with responsive "View Subtasks" link */}
      <CardFooter className="pt-2 pb-3 px-3 sm:px-4 flex justify-end items-center">
        <Button
          variant="link"
          size="sm"
          className={cn(
            "h-auto p-0 text-xs text-primary font-medium",
            // Always visible on mobile (default), hidden on sm+, shown on group-hover on sm+
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100",
            "transition-opacity duration-200"
          )}
          onClick={(e) => onNavigateToSubtasks(e, task.TaskId)} // Use specific handler
          aria-label={`View subtasks for ${task.title}`}
        >
          View Subtasks
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewTaskDetailsData, setViewTaskDetailsData] = useState<Task | null>(
    null
  );

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
    // Navigate to the member's view of subtasks for this task
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
  };
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
      return matchesSearch && matchesStatus;
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
      return orderA - orderB;
    });

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <div className="flex justify-end">
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Project Tasks</AlertTitle>
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
    <div className="container mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center justify-center gap-2">
          <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
          <span>{projectTitle || `Project ${projectId}`}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Tasks assigned to your team
        </p>
      </div>

      {/* Filters/View Options */}
      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full sm:w-48 lg:w-64 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-auto md:w-[160px] h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="re assigned">Re-Assigned</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="h-9 w-9 flex-shrink-0"
            >
              {" "}
              <X className="h-4 w-4" />{" "}
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

      {/* Task List/Grid */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card mt-6">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Tasks Assigned</h3>
          <p className="text-muted-foreground mb-6">
            No tasks have been assigned to your team for this project yet.
          </p>
        </div>
      ) : filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card mt-6">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Matching Tasks</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search or filter criteria.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        </div>
      ) : (
        <div
          className={`grid gap-4 sm:gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
        >
          {filteredAndSortedTasks.map((task) => (
            <TaskCardMember
              key={task.TaskId}
              task={task}
              onClick={handleOpenDetailsDialog}
              onNavigateToSubtasks={handleNavigateToMemberSubtasks}
            />
          ))}
        </div>
      )}

      {/* --- Task Details Dialog (View Only) --- */}
      <Dialog
        open={!!viewTaskDetailsData}
        onOpenChange={(open) => !open && handleCloseDetailsDialog()}
      >
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {viewTaskDetailsData?.title || "Task Details"}
              {viewTaskDetailsData?.status && (
                <Badge
                  variant="outline"
                  className={`ml-auto border border-l-4 ${getStatusColor(viewTaskDetailsData.status)}`}
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
              {/* Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Project
                  </Label>
                  <p>{projectTitle || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" /> Deadline
                  </Label>
                  <p>
                    {format(new Date(viewTaskDetailsData.deadline), "PPPp")}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 mr-1.5" /> Created At
                  </Label>
                  <p>
                    {format(new Date(viewTaskDetailsData.createdAt), "PPp")}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 mr-1.5" /> Last Updated
                  </Label>
                  <p>
                    {format(new Date(viewTaskDetailsData.updatedAt), "PPp")}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <Label
                  htmlFor="details-description"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Description
                </Label>
                <Textarea
                  id="details-description"
                  value={viewTaskDetailsData.description}
                  readOnly
                  className="min-h-[100px] bg-muted/30 border-none"
                />
              </div>
              {/* Submission Details (If available) */}
              {(viewTaskDetailsData.submittedby &&
                viewTaskDetailsData.submittedby !== "Not-submitted") ||
              viewTaskDetailsData.status === "Completed" ||
              viewTaskDetailsData.status === "Re Assigned" ? (
                <>
                  <Separator />
                  <h4 className="text-base font-semibold pt-2">
                    {viewTaskDetailsData.status === "Re Assigned"
                      ? "Previous Submission / Feedback"
                      : "Submission Details"}
                  </h4>
                  <div className="space-y-3 pl-2 border-l-2">
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs font-medium text-muted-foreground">
                        <User className="w-3.5 h-3.5 mr-1.5" /> Submitted By
                      </Label>
                      <p className="text-sm">
                        {viewTaskDetailsData.submittedby &&
                        viewTaskDetailsData.submittedby !== "Not-submitted"
                          ? (() => {
                              const s = submitters.find(
                                (sub: Member) =>
                                  sub.UserId ===
                                  viewTaskDetailsData?.submittedby
                              );
                              return s
                                ? `${s.firstname} ${s.lastname} (${s.email})`
                                : `User ID: ${viewTaskDetailsData.submittedby}`;
                            })()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="details-github-url"
                        className="flex items-center text-xs font-medium text-muted-foreground"
                      >
                        <Github className="w-3.5 h-3.5 mr-1.5" /> GitHub URL
                      </Label>
                      {viewTaskDetailsData.gitHubUrl ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            id="details-github-url"
                            value={viewTaskDetailsData.gitHubUrl}
                            readOnly
                            className="font-mono text-xs h-8 flex-1 bg-muted/30 border-none"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() =>
                              copyToClipboard(viewTaskDetailsData?.gitHubUrl)
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
                        htmlFor="details-context"
                        className="flex items-center text-xs font-medium text-muted-foreground"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />{" "}
                        {viewTaskDetailsData.status === "Re Assigned"
                          ? "Feedback Provided"
                          : "Explanation/Context"}
                      </Label>
                      <Textarea
                        id="details-context"
                        value={
                          viewTaskDetailsData.context ||
                          (viewTaskDetailsData.status === "Re Assigned"
                            ? "No feedback recorded."
                            : "No explanation provided.")
                        }
                        readOnly
                        className={`min-h-[80px] text-sm bg-muted/30 border-none ${viewTaskDetailsData.status === "Re Assigned" ? "border-l-4 border-amber-400 pl-3" : ""}`}
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}
          <DialogFooter className="pt-4 mt-4 border-t">
            <Button variant="outline" onClick={handleCloseDetailsDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
