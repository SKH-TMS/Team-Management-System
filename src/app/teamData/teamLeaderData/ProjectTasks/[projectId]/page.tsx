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
  GitBranch, // Using GitBranch for subtasks icon
  Send,
  Eye,
  Github,
  Copy,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Assuming types.ts is in the same directory or adjust path
// Make sure this path is correct for your project structure
import type { Task, Member } from "./types";

// --- Task Card Component (Placeholder - Extract to its own file later) ---
interface TaskCardTeamLeadProps {
  task: Task;
  onClick: () => void; // Handler for clicking the card itself
  onOpenSubmitDialog: (e: React.MouseEvent, task: Task) => void; // Pass event to stop propagation
  onNavigateToSubtasks: (e: React.MouseEvent, taskId: string) => void; // Pass event
  onViewCompletedTask: (e: React.MouseEvent, task: Task) => void; // Pass event
}

function TaskCardTeamLead({
  task,
  onClick,
  onOpenSubmitDialog,
  onNavigateToSubtasks,
  onViewCompletedTask,
}: TaskCardTeamLeadProps) {
  // Helper to get status badge styling
  const getStatusBadge = () => {
    switch (
      task.status?.toLowerCase() // Use optional chaining and lower case
    ) {
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

  // Helper to get background color based on status
  const getBgColor = () => {
    switch (
      task.status?.toLowerCase() // Use optional chaining and lower case
    ) {
      case "in progress":
        return "bg-blue-50 border-blue-200";
      case "completed":
        return "bg-green-50 border-green-200";
      case "pending":
        return "bg-gray-50 border-gray-200";
      case "re assigned":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-card border"; // Default card background and border
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-lg shadow hover:shadow-lg sm:hover:shadow-2xl transform transition-all duration-300 sm:hover:-translate-y-1 cursor-pointer border-l-4",
        getBgColor() // Apply background color class
      )}
      onClick={onClick} // Attach the main card click handler
    >
      {/* Responsive Padding: px-4 sm:px-6 */}
      <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="flex justify-between items-start gap-2">
          {/* Responsive Title Size: text-base sm:text-lg */}
          <CardTitle className="text-base sm:text-lg font-medium line-clamp-2 break-words">
            {task.title}
          </CardTitle>
          <div className="flex-shrink-0">{getStatusBadge()}</div>
        </div>
      </CardHeader>
      {/* Responsive Padding: px-4 sm:px-6 */}
      <CardContent className="space-y-2 pb-3 text-sm px-4 sm:px-6">
        {/* Responsive Line Clamp: line-clamp-2 sm:line-clamp-3 */}
        <p className="text-muted-foreground line-clamp-2 sm:line-clamp-3">
          {task.description}
        </p>
        <div className="flex items-center text-xs text-muted-foreground pt-1">
          <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
          {/* Format deadline date */}
          <span className="truncate">
            Due:{" "}
            {task.deadline ? format(new Date(task.deadline), "PPp") : "N/A"}
          </span>
        </div>
      </CardContent>
      {/* Responsive Padding: px-4 sm:px-6 */}
      <CardFooter className="pt-2 pb-3 flex flex-wrap justify-end items-center gap-2 px-4 sm:px-6">
        {" "}
        {/* Added flex-wrap */}
        {/* Conditional Buttons for Team Leader */}
        {task.status === "Completed" ? (
          // Responsive Button: text-xs h-7 px-2
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
      </CardFooter>
    </Card>
  );
}
// --- End Placeholder Task Card ---

export default function TeamLeadProjectTasksPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [submitters, setSubmitters] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<{ UserId: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // State for Modals/Dialogs
  const [submitTaskData, setSubmitTaskData] = useState<Task | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionContext, setSubmissionContext] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewCompletedTaskData, setViewCompletedTaskData] =
    useState<Task | null>(null);
  const [viewTaskDetailsData, setViewTaskDetailsData] = useState<Task | null>(
    null
  );

  // Fetch Project Tasks for Team Leader
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
      setSubmitters(data.submitters || []);
      setCurrentUser(data.currentUser || null);
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

  // --- Event Handlers ---

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("URL copied to clipboard!");
    });
  };

  // Open Submit Dialog
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

  // Handle Task Submission
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

  // Navigate to Subtasks Page
  const handleNavigateToSubtasks = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    router.push(`/teamData/teamLeaderData/SubTasks/${taskId}`);
  };

  // Open View Completed Task Dialog
  const handleViewCompletedTask = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setViewCompletedTaskData(task);
  };

  const handleCloseViewCompletedDialog = () => {
    setViewCompletedTaskData(null);
  };

  // Open General Details Dialog
  const handleCardClick = (task: Task) => {
    setViewTaskDetailsData(task);
  };
  const handleCloseTaskDetailsDialog = () => {
    setViewTaskDetailsData(null);
  };

  // Status Helper Functions
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-end items-stretch sm:items-center gap-2 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {" "}
          {/* Adjusted width */}
          <div className="relative flex-grow sm:flex-grow-0">
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
            There are currently no tasks assigned to your team for this project.
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
          className={`grid gap-4 sm:gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}
        >
          {filteredAndSortedTasks.map((task) => (
            <TaskCardTeamLead
              key={task.TaskId}
              task={task}
              onClick={() => handleCardClick(task)}
              onOpenSubmitDialog={handleOpenSubmitDialog}
              onNavigateToSubtasks={handleNavigateToSubtasks}
              onViewCompletedTask={handleViewCompletedTask}
            />
          ))}
        </div>
      )}

      {/* --- Modals --- */}

      {/* Submit Task Dialog */}
      <Dialog
        open={!!submitTaskData}
        onOpenChange={(open) => !open && handleCloseSubmitDialog()}
      >
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
            <Button variant="outline" onClick={handleCloseViewCompletedDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* General Task Details Dialog */}
      <Dialog
        open={!!viewTaskDetailsData}
        onOpenChange={(open) => !open && handleCloseTaskDetailsDialog()}
      >
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {viewTaskDetailsData?.title || "Task Details"}
              {viewTaskDetailsData?.status && (
                <Badge
                  variant="outline"
                  className={`ml-auto ${getStatusColor(viewTaskDetailsData.status)}`}
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
                <div className="space-y-1 md:col-span-2">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Info className="w-3.5 h-3.5 mr-1.5" /> Status
                  </Label>
                  <p>{viewTaskDetailsData.status}</p>
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
                    <div className="space-y-1"></div>
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
                              copyToClipboard(
                                viewTaskDetailsData?.gitHubUrl || ""
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
            <Button variant="outline" onClick={handleCloseTaskDetailsDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
