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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionAlias,
  AlertDialogFooter as AlertDialogFooterAlias,
  AlertDialogHeader as AlertDialogHeaderAlias,
  AlertDialogTitle as AlertDialogTitleAlias, // Use Alias for AlertDialog Description/Title/Footer
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  Briefcase,
  LayoutGrid,
  LayoutList,
  Search,
  Filter,
  X,
  Loader2,
  PlusCircle,
  ArrowLeft,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  Info,
  Github,
  Copy,
  MessageSquare,
  FileEdit,
  AlertTriangle,
  RefreshCw, // Added icons
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Define or import types ---
// Assuming types are defined here or imported from a shared location like './types'
interface ISubtask {
  SubtaskId: string;
  parentTaskId: string;
  title: string;
  description: string;
  assignedTo: string; // UserID
  deadline: string; // ISO String or Date
  status: string;
  gitHubUrl?: string;
  context?: string;
  submittedBy?: string; // UserID
  createdAt: string; // ISO String or Date
  updatedAt: string; // ISO String or Date
}

interface ITask {
  // Parent Task Details
  TaskId: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
}

interface Member {
  // Team Member Details
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string; // Ensure profilepic is included
}
// --- End Type Definitions ---

// --- Subtask Card Component (Placeholder - Extract Later) ---
interface SubtaskCardProps {
  subtask: ISubtask;
  assignee?: Member | null;
  onClick: (subtask: ISubtask) => void;
  onUpdate: (subtaskId: string) => void;
}

function SubtaskCard({
  subtask,
  assignee,
  onClick,
  onUpdate,
}: SubtaskCardProps) {
  const getStatusBadge = () => {
    switch (subtask.status?.toLowerCase()) {
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
      default:
        return (
          <Badge className="text-xs px-1.5 py-0.5">
            {subtask.status || "Unknown"}
          </Badge>
        );
    }
  };
  const getBgColor = () => {
    switch (subtask.status?.toLowerCase()) {
      case "in progress":
        return "bg-blue-50 border-blue-200";
      case "completed":
        return "bg-green-50 border-green-200";
      case "pending":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-card border";
    }
  };

  const getInitials = (firstname?: string, lastname?: string) => {
    if (!firstname) return "?";
    if (!lastname) return firstname.charAt(0).toUpperCase();
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-shadow cursor-pointer border flex flex-col group", // Added group
        getBgColor()
      )}
      onClick={() => onClick(subtask)} // Attach main click handler
    >
      <CardHeader className="pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2">
            {subtask.title}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-3 pb-3 px-3 sm:px-4 flex-grow">
        <p className="text-muted-foreground line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm">
          {subtask.description}
        </p>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 mr-1.5" />
          Due: {format(new Date(subtask.deadline), "PP")}
        </div>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground pt-1">
          <User className="w-4 h-4 mr-1.5" />
          Assignee:
          {assignee ? (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 ml-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={assignee.profilepic}
                        alt={assignee.firstname}
                      />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(assignee.firstname, assignee.lastname)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground truncate">
                      {assignee.firstname} {assignee.lastname}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{assignee.email}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="ml-1.5 italic">N/A</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-3 px-3 sm:px-4 flex justify-end items-center">
        {/* Responsive Update Button */}
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "h-7 w-7 rounded-full",
            // Always visible on mobile (default), hidden on sm+, shown on group-hover on sm+
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100",
            "transition-opacity duration-200",
            "hover:bg-accent"
          )}
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click opening details dialog
            onUpdate(subtask.SubtaskId); // Call the update handler
          }}
          aria-label="Update Subtask"
        >
          <FileEdit className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
// --- End Placeholder Subtask Card ---

export default function SubTasksPage() {
  const params = useParams();
  const parentTaskId = params.taskId as string;
  const router = useRouter();

  // State
  const [subtasks, setSubtasks] = useState<ISubtask[]>([]);
  const [parentTask, setParentTask] = useState<ITask | null>(null);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [viewSubtaskDetailsData, setViewSubtaskDetailsData] =
    useState<ISubtask | null>(null);

  // State for Mark Pending action
  const [isMarkingPending, setIsMarkingPending] = useState(false); // Flag within details dialog
  const [pendingFeedback, setPendingFeedback] = useState("");
  const [showSubtaskMarkPendingConfirm, setShowSubtaskMarkPendingConfirm] =
    useState(false);
  const [isProcessingStatusChange, setIsProcessingStatusChange] =
    useState(false); // Loading state for status buttons

  // Fetch Subtasks and Parent Task Info
  const fetchSubtaskData = useCallback(async () => {
    if (!parentTaskId) {
      setError("Parent Task ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/teamData/teamLeaderData/getSubTasks/${parentTaskId}`,
        { method: "GET" }
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "Failed to fetch subtasks.");
      setParentTask(data.parentTask || null);
      setSubtasks(data.subtasks || []);
      setTeamMembers(data.teamMembers || []);
    } catch (err: any) {
      console.error("Error fetching subtasks:", err);
      const message = err.message || "Failed to load subtasks.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [parentTaskId]);

  useEffect(() => {
    fetchSubtaskData();
  }, [fetchSubtaskData]);

  // --- Event Handlers ---
  const handleNavigateToCreate = () => {
    router.push(`/teamData/teamLeaderData/CreateSubTask/${parentTaskId}`);
  };

  const handleOpenDetailsDialog = (subtask: ISubtask) => {
    setViewSubtaskDetailsData(subtask);
    setIsMarkingPending(false); // Reset pending mode
    setPendingFeedback(""); // Reset feedback
  };

  const handleCloseDetailsDialog = () => {
    setViewSubtaskDetailsData(null);
    setIsMarkingPending(false);
    setPendingFeedback("");
  };

  const copyToClipboard = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("URL copied to clipboard!");
    });
  };

  const handleNavigateToUpdate = (subtaskId: string) => {
    router.push(
      `/teamData/teamLeaderData/SubTasks/${parentTaskId}/UpdateSubTask/${subtaskId}`
    );
  };

  // Mark Subtask Completed Handler
  const handleMarkSubtaskCompleted = async () => {
    if (!viewSubtaskDetailsData) return;
    setIsProcessingStatusChange(true);
    try {
      const response = await fetch(
        `/api/teamData/teamLeaderData/markSubtaskCompleted/${viewSubtaskDetailsData.SubtaskId}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "Failed to mark subtask completed.");
      toast.success("Subtask marked as Completed!");
      setSubtasks((prev) =>
        prev.map((st) =>
          st.SubtaskId === viewSubtaskDetailsData.SubtaskId
            ? { ...st, status: "Completed" }
            : st
        )
      );
      handleCloseDetailsDialog();
    } catch (err: any) {
      console.error("Error marking subtask completed:", err);
      toast.error(err.message || "Failed to mark subtask completed.");
    } finally {
      setIsProcessingStatusChange(false);
    }
  };

  // Mark Subtask Pending Handlers
  const handleOpenMarkPendingDialog = () => {
    if (!viewSubtaskDetailsData) return;
    setIsMarkingPending(true); // Show feedback input in the main dialog
  };

  const handleConfirmMarkPending = () => {
    // Trigger the confirmation dialog
    if (pendingFeedback.trim() === "") {
      toast.error("Feedback is required to mark as pending.");
      return;
    }
    setShowSubtaskMarkPendingConfirm(true);
  };

  const executeMarkSubtaskPending = async () => {
    // Actual API call after confirmation
    if (!viewSubtaskDetailsData || pendingFeedback.trim() === "") return;
    setIsProcessingStatusChange(true);
    try {
      const response = await fetch(
        `/api/teamData/teamLeaderData/markSubtaskPending/${viewSubtaskDetailsData.SubtaskId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: pendingFeedback.trim() }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "Failed to mark subtask pending.");
      toast.success("Subtask marked as Pending!");
      setSubtasks((prev) =>
        prev.map((st) =>
          st.SubtaskId === viewSubtaskDetailsData.SubtaskId
            ? {
                ...st,
                status: "Pending",
                gitHubUrl: undefined,
                context: undefined,
                submittedBy: undefined,
              }
            : st
        )
      );
      handleCloseDetailsDialog(); // Close details dialog
    } catch (err: any) {
      console.error("Error marking subtask pending:", err);
      toast.error(err.message || "Failed to mark subtask pending.");
    } finally {
      setIsProcessingStatusChange(false);
      setPendingFeedback("");
      setIsMarkingPending(false);
    }
  };
  // --- End Status Change Handlers ---

  // Filter/Sort Logic
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setAssigneeFilter("all");
  };
  const filteredAndSortedSubtasks = subtasks
    .filter((subtask) => {
      const lowerSearchQuery = searchQuery.toLowerCase();
      const assignee = teamMembers.find((m) => m.UserId === subtask.assignedTo);
      const assigneeName = assignee
        ? `${assignee.firstname} ${assignee.lastname}`.toLowerCase()
        : "";
      const matchesSearch =
        searchQuery === "" ||
        subtask.title.toLowerCase().includes(lowerSearchQuery) ||
        subtask.description.toLowerCase().includes(lowerSearchQuery) ||
        assigneeName.includes(lowerSearchQuery);
      const matchesStatus =
        statusFilter === "all" ||
        subtask.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesAssignee =
        assigneeFilter === "all" || subtask.assignedTo === assigneeFilter;
      return matchesSearch && matchesStatus && matchesAssignee;
    })
    .sort((a, b) => {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  // --- Render Logic ---

  if (loading) {
    /* ... skeleton ... */
  }
  if (error) {
    /* ... error display ... */
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Parent Task Header */}
      <Card className="mb-6 bg-muted/50">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="absolute top-4 left-4 h-7 w-7 p-0 z-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl sm:text-2xl text-center pt-2">
            Subtasks for: {parentTask?.title || "Task"}
          </CardTitle>
          {parentTask?.description && (
            <CardDescription className="text-center pt-1 max-w-xl mx-auto">
              {parentTask.description}
            </CardDescription>
          )}
        </CardHeader>
        {parentTask?.deadline && (
          <CardFooter className="text-xs sm:text-sm text-muted-foreground justify-center pb-4">
            <Calendar className="w-4 h-4 mr-1.5" /> Parent Task Deadline:{" "}
            {format(new Date(parentTask.deadline), "PPPp")}
          </CardFooter>
        )}
      </Card>

      {/* Actions & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <Button onClick={handleNavigateToCreate} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Create Subtask
        </Button>
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subtasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full sm:w-40 md:w-48 h-9"
            />
          </div>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-full sm:w-auto md:w-[180px] h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Filter Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.UserId} value={member.UserId}>
                  {member.firstname} {member.lastname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-auto md:w-[160px] h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
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
              {" "}
              <X className="h-4 w-4" />{" "}
            </Button>
          )}
        </div>
      </div>

      {/* Subtask List/Grid */}
      {subtasks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card mt-6">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Subtasks Created Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create the first subtask for this main task.
          </p>
          <Button onClick={handleNavigateToCreate}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Subtask
          </Button>
        </div>
      ) : filteredAndSortedSubtasks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card mt-6">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Matching Subtasks</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search or filter criteria.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        </div>
      ) : (
        <div
          className={`grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
        >
          {filteredAndSortedSubtasks.map((subtask) => {
            const assignee = teamMembers.find(
              (m) => m.UserId === subtask.assignedTo
            );
            return (
              <SubtaskCard
                key={subtask.SubtaskId}
                subtask={subtask}
                assignee={assignee}
                onClick={handleOpenDetailsDialog}
                onUpdate={handleNavigateToUpdate}
              />
            );
          })}
        </div>
      )}

      {/* --- Subtask Details Dialog --- */}
      <Dialog
        open={!!viewSubtaskDetailsData}
        onOpenChange={(open) => !open && handleCloseDetailsDialog()}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Subtask: {viewSubtaskDetailsData?.title}
            </DialogTitle>
            <DialogDescription>
              Details and actions for this subtask.
            </DialogDescription>
          </DialogHeader>
          {viewSubtaskDetailsData && (
            <div className="space-y-4 py-4 text-sm">
              {/* Display Subtask Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {/* Assignee, Deadline, Status, Last Updated */}
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <User className="w-3.5 h-3.5 mr-1.5" /> Assignee
                  </Label>
                  <p>
                    {teamMembers.find(
                      (m) => m.UserId === viewSubtaskDetailsData.assignedTo
                    )?.firstname ?? "N/A"}{" "}
                    {teamMembers.find(
                      (m) => m.UserId === viewSubtaskDetailsData.assignedTo
                    )?.lastname ?? ""}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" /> Deadline
                  </Label>
                  <p>
                    {format(new Date(viewSubtaskDetailsData.deadline), "PPPp")}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Info className="w-3.5 h-3.5 mr-1.5" /> Status
                  </Label>
                  <p>{viewSubtaskDetailsData.status}</p>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 mr-1.5" /> Last Updated
                  </Label>
                  <p>
                    {format(new Date(viewSubtaskDetailsData.updatedAt), "PPp")}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <Label
                  htmlFor="details-sub-description"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Description
                </Label>
                <Textarea
                  id="details-sub-description"
                  value={viewSubtaskDetailsData.description}
                  readOnly
                  className="min-h-[80px] bg-muted/30 border-none"
                />
              </div>

              {/* Display Subtask Submission if available */}
              {viewSubtaskDetailsData.status === "Completed" && (
                <>{/* ... Submission Details Section ... */}</>
              )}

              {/* Feedback Input Area (Conditional) */}
              {isMarkingPending && (
                <div className="space-y-1 pt-4 border-t">
                  <Label
                    htmlFor="pending-feedback"
                    className="flex items-center text-sm font-medium text-destructive"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1.5" /> Feedback for
                    Rejection (Required)
                  </Label>
                  <Textarea
                    id="pending-feedback"
                    value={pendingFeedback}
                    onChange={(e) => setPendingFeedback(e.target.value)}
                    placeholder="Provide clear reasons..."
                    className="min-h-[100px]"
                    required
                    disabled={isProcessingStatusChange}
                  />
                  {pendingFeedback.trim() === "" && (
                    <p className="text-xs text-red-600">Feedback is required</p>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Dialog Footer with Conditional Buttons */}
          <DialogFooter className="pt-4 mt-4 border-t flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCloseDetailsDialog}
              disabled={isProcessingStatusChange}
            >
              Close
            </Button>

            {/* Edit Button */}
            {viewSubtaskDetailsData && !isMarkingPending && (
              <Button
                onClick={() =>
                  handleNavigateToUpdate(viewSubtaskDetailsData.SubtaskId)
                }
                disabled={isProcessingStatusChange}
              >
                <FileEdit className="mr-2 h-4 w-4" /> Edit Subtask
              </Button>
            )}

            {/* Mark Pending / Confirm Rejection Button */}
            {viewSubtaskDetailsData &&
              (viewSubtaskDetailsData.status === "Completed" ||
                viewSubtaskDetailsData.status === "In Progress") && (
                <>
                  {isMarkingPending ? (
                    <Button
                      variant="destructive"
                      onClick={handleConfirmMarkPending}
                      disabled={
                        pendingFeedback.trim() === "" ||
                        isProcessingStatusChange
                      }
                    >
                      {isProcessingStatusChange ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 mr-2" />
                      )}
                      Confirm Rejection
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={handleOpenMarkPendingDialog}
                      disabled={isProcessingStatusChange}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" /> Mark Pending
                    </Button>
                  )}
                </>
              )}

            {/* Mark Completed Button */}
            {viewSubtaskDetailsData &&
              viewSubtaskDetailsData.status === "In Progress" &&
              !isMarkingPending && (
                <Button
                  onClick={handleMarkSubtaskCompleted}
                  disabled={isProcessingStatusChange}
                >
                  {isProcessingStatusChange ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Mark Completed
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Mark Pending */}
      <AlertDialog
        open={showSubtaskMarkPendingConfirm}
        onOpenChange={setShowSubtaskMarkPendingConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeaderAlias>
            <AlertDialogTitleAlias className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
              Confirm Mark as Pending
            </AlertDialogTitleAlias>
            <AlertDialogDescriptionAlias>
              Are you sure you want to mark this subtask as pending? This will
              clear any submission data and require the team member to redo the
              work based on your feedback.
              <p className="mt-2 font-medium">Feedback:</p>
              <p className="text-sm text-muted-foreground p-2 border rounded bg-muted/50">
                {pendingFeedback || "(No feedback provided)"}
              </p>
            </AlertDialogDescriptionAlias>
          </AlertDialogHeaderAlias>
          <AlertDialogFooterAlias>
            <AlertDialogCancel
              onClick={() => setIsProcessingStatusChange(false)}
              disabled={isProcessingStatusChange}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeMarkSubtaskPending}
              disabled={isProcessingStatusChange}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessingStatusChange ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooterAlias>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
