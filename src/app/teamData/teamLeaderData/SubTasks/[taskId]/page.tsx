// src/app/teamData/teamLeaderData/SubTasks/[taskId]/page.tsx
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
  AlertDialogTitle as AlertDialogTitleAlias,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
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
  FileEdit,
  AlertTriangle,
  RefreshCw,
  Users,
  FileText,
  ExternalLink,
  CalendarClock,
  Check,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Define or import types ---
interface ISubtask {
  SubtaskId: string;
  parentTaskId: string;
  title: string;
  description: string;
  assignedTo: string | string[];
  deadline: string;
  status: string;
  gitHubUrl?: string;
  context?: string;
  submittedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface ITask {
  TaskId: string;
  title: string;
  description?: string;
  deadline?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
  profilepic?: string;
}
// --- End Type Definitions ---

// --- Mock API Function for Batch Delete ---
const deleteSubtasksBatch = async (subtaskIds: string[]): Promise<boolean> => {
  console.log("Attempting to delete subtasks:", subtaskIds);
  const response = await fetch(
    `/api/teamData/teamLeaderData/deleteSubtasksBatch`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subtaskIds: subtaskIds }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to delete subtasks via API.");
  }

  toast.success(data.message || `Deleted ${data.deletedCount} subtask(s).`);
  return true;
};
// --- End Mock API ---

// --- Subtask Card Component (Modified for Selection & Responsiveness) ---
interface SubtaskCardProps {
  subtask: ISubtask;
  assignees: Member[];
  isSelected: boolean;
  isSelectionMode: boolean;
  onCardClick: (subtask: ISubtask) => void;
  onUpdateClick: (subtaskId: string) => void;
  onToggleSelect: (subtaskId: string) => void;
}

function SubtaskCard({
  subtask,
  assignees,
  isSelected,
  isSelectionMode,
  onCardClick,
  onUpdateClick,
  onToggleSelect,
}: SubtaskCardProps) {
  // --- Helper functions ---
  const isOverdue = (d: string) => new Date(d) < new Date();
  const isDueSoon = (d: string) => {
    const diff = new Date(d).getTime() - Date.now();
    return diff > 0 && diff < 1000 * 60 * 60 * 24;
  };
  const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return "Overdue";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} day${days !== 1 ? "s" : ""} left`;
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""} left`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes} min${minutes !== 1 ? "s" : ""} left`;
  };
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "in progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center hover:bg-blue-200">
            <Clock className="mr-1 w-3 h-3" /> In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center hover:bg-green-200">
            <Check className="mr-1 w-3 h-3" /> Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full flex items-center hover:bg-gray-200">
            <AlertCircle className="mr-1 w-3 h-3" /> Pending
          </Badge>
        );
      default:
        return (
          <Badge className="text-xs px-2 py-0.5 rounded-full">
            {status || "Unknown"}
          </Badge>
        );
    }
  };
  const getBgColor = (status: string, deadline: string) => {
    if (isSelected) return "bg-pink-100 border-pink-300";
    if (isOverdue(deadline) && status?.toLowerCase() !== "completed")
      return "bg-red-50 border-red-200";
    switch (status?.toLowerCase()) {
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
  const getBorderColor = (status: string, deadline: string) => {
    if (isSelected) return "border-pink-400 ring-2 ring-pink-300 ring-offset-1";
    if (isOverdue(deadline) && status?.toLowerCase() !== "completed")
      return "border-red-400";
    switch (status?.toLowerCase()) {
      case "in progress":
        return "border-blue-400";
      case "completed":
        return "border-green-400";
      case "pending":
        return "border-gray-400";
      default:
        return "border-gray-200";
    }
  };
  const getInitials = (firstname?: string, lastname?: string) => {
    if (!firstname) return "?";
    if (!lastname) return firstname.charAt(0).toUpperCase();
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };
  // --- End Helper functions ---

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-lg shadow-sm border-2 flex flex-col group transform transition-all duration-200",
        isSelectionMode
          ? "cursor-pointer hover:-translate-y-0"
          : "hover:-translate-y-1 cursor-pointer",
        getBgColor(subtask.status, subtask.deadline),
        getBorderColor(subtask.status, subtask.deadline)
      )}
      onClick={() => onCardClick(subtask)}
    >
      {/* Selection Indicator */}
      {isSelectionMode && (
        <div
          className={cn(
            "absolute top-2 left-2 z-10 rounded-full bg-white/70 backdrop-blur-sm p-1 shadow cursor-pointer",
            isSelected ? "text-pink-600" : "text-muted-foreground"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(subtask.SubtaskId);
          }}
          aria-label={isSelected ? "Deselect subtask" : "Select subtask"}
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </div>
      )}

      {/* Responsive Padding */}
      <CardHeader className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
        <div className="flex justify-between items-start mb-2 gap-2">
          {getStatusBadge(subtask.status)}
          <div
            className={cn(
              "text-xs px-2 py-1 rounded-full flex items-center flex-shrink-0", // Prevent shrinking
              isOverdue(subtask.deadline) &&
                subtask.status?.toLowerCase() !== "completed"
                ? "bg-red-100 text-red-800"
                : isDueSoon(subtask.deadline) &&
                    subtask.status?.toLowerCase() !== "completed"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-800"
            )}
          >
            <CalendarClock className="mr-1 w-3 h-3" />
            {getTimeRemaining(subtask.deadline)}
          </div>
        </div>
        {/* Responsive Title Size */}
        <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2">
          {subtask.title}
        </CardTitle>
      </CardHeader>
      {/* Responsive Padding & Text Size */}
      <CardContent className="flex-grow px-3 sm:px-4 pb-2 text-sm text-muted-foreground">
        <p className="line-clamp-3 mb-3 sm:mb-4">{subtask.description}</p>
        <div className="flex items-center mt-3 sm:mt-4">
          <Users className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
          {assignees.length > 0 ? (
            <div className="flex -space-x-2 overflow-hidden">
              {assignees.map((m) => (
                <Tooltip key={m.UserId}>
                  <TooltipTrigger asChild>
                    {/* Responsive Avatar Size */}
                    <Avatar className="h-6 w-6 sm:h-7 sm:w-7 ring-2 ring-white transform transition-transform hover:scale-110">
                      <AvatarImage src={m.profilepic ?? ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-[10px]">
                        {getInitials(m.firstname, m.lastname)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-white border shadow-md p-2"
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.profilepic ?? ""} />
                        <AvatarFallback>
                          {getInitials(m.firstname, m.lastname)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {m.firstname} {m.lastname}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.email}
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            <span className="text-xs italic">Unassigned</span>
          )}
        </div>
      </CardContent>
      {/* Responsive Padding */}
      <CardFooter className="px-3 sm:px-4 pt-2 pb-3 sm:pb-4 flex justify-between items-center border-t border-muted/20 mt-2">
        <div className="text-xs text-muted-foreground flex items-center">
          <Calendar className="mr-1 w-3 h-3" />
          Due: {format(new Date(subtask.deadline), "MMM d")}
        </div>
        {/* --- RESPONSIVE UPDATE BUTTON --- */}
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "h-7 w-7 rounded-full",
            // --- RESPONSIVE CHANGE ---
            // Always visible on mobile (base), hover effect on sm+
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
            "transition-opacity duration-200",
            "hover:bg-accent",
            isSelectionMode && "opacity-50 cursor-not-allowed" // Still disable in selection mode
          )}
          onClick={(e) => {
            if (isSelectionMode) return;
            e.stopPropagation();
            onUpdateClick(subtask.SubtaskId);
          }}
          aria-label="Update Subtask"
          disabled={isSelectionMode}
          tabIndex={isSelectionMode ? -1 : 0}
        >
          <FileEdit className="h-4 w-4" />
        </Button>
        {/* --- END RESPONSIVE UPDATE BUTTON --- */}
      </CardFooter>
      {subtask.gitHubUrl && !isSelected && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/30"></div>
      )}
    </Card>
  );
}
// --- End Subtask Card Component ---

export default function TeamLeaderSubTasksPage() {
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

  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSubtaskIds, setSelectedSubtaskIds] = useState<Set<string>>(
    new Set()
  );

  // Action States
  const [isMarkingPending, setIsMarkingPending] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState("");
  const [showSubtaskMarkPendingConfirm, setShowSubtaskMarkPendingConfirm] =
    useState(false);
  const [isProcessingStatusChange, setIsProcessingStatusChange] =
    useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  // Helper function to get assignees
  const getAssigneesForSubtask = useCallback(
    (subtask: ISubtask): Member[] => {
      const assignedIds = Array.isArray(subtask.assignedTo)
        ? subtask.assignedTo
        : [subtask.assignedTo].filter(Boolean);
      return teamMembers.filter((member) =>
        assignedIds.includes(member.UserId)
      );
    },
    [teamMembers]
  );

  // Fetch Data
  const fetchSubtaskData = useCallback(async () => {
    if (!parentTaskId) {
      setError("Parent Task ID is missing.");
      setLoading(false);
      return;
    }
    setIsSelectionMode(false);
    setSelectedSubtaskIds(new Set());
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
    if (isSelectionMode) return;
    router.push(`/teamData/teamLeaderData/CreateSubTask/${parentTaskId}`);
  };

  const handleOpenDetailsDialog = (subtask: ISubtask) => {
    if (isSelectionMode) return;
    setViewSubtaskDetailsData(subtask);
    setIsMarkingPending(false);
    setPendingFeedback("");
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
    if (isSelectionMode) return;
    router.push(
      `/teamData/teamLeaderData/SubTasks/${parentTaskId}/UpdateSubTask/${subtaskId}`
    );
  };

  // --- Selection Handlers ---
  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    setSelectedSubtaskIds(new Set());
  };

  const handleToggleSelectSubtask = (subtaskId: string) => {
    setSelectedSubtaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subtaskId)) {
        newSet.delete(subtaskId);
      } else {
        newSet.add(subtaskId);
      }
      return newSet;
    });
  };

  const handleCardClick = (subtask: ISubtask) => {
    if (isSelectionMode) {
      handleToggleSelectSubtask(subtask.SubtaskId);
    } else {
      handleOpenDetailsDialog(subtask);
    }
  };
  // --- End Selection Handlers ---

  // --- Delete Selected Handler ---
  const handleDeleteSelected = async () => {
    if (selectedSubtaskIds.size === 0) return;
    setIsDeletingSelected(true);
    setShowDeleteConfirm(false);
    try {
      const idsToDelete = Array.from(selectedSubtaskIds);
      await deleteSubtasksBatch(idsToDelete);
      setSubtasks((prev) =>
        prev.filter((st) => !selectedSubtaskIds.has(st.SubtaskId))
      );
      setSelectedSubtaskIds(new Set());
      setIsSelectionMode(false);
    } catch (err: any) {
      console.error("Error deleting selected subtasks:", err);
      toast.error(err.message || "Failed to delete selected subtasks.");
    } finally {
      setIsDeletingSelected(false);
    }
  };
  // --- End Delete Selected Handler ---

  // --- Status Change Handlers ---
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

  const handleOpenMarkPendingDialog = () => {
    if (!viewSubtaskDetailsData) return;
    setIsMarkingPending(true);
  };

  const handleConfirmMarkPending = () => {
    if (pendingFeedback.trim() === "") {
      toast.error("Feedback is required to mark as pending.");
      return;
    }
    setShowSubtaskMarkPendingConfirm(true);
  };

  const executeMarkSubtaskPending = async () => {
    if (!viewSubtaskDetailsData || pendingFeedback.trim() === "") return;
    setIsProcessingStatusChange(true);
    setShowSubtaskMarkPendingConfirm(false);
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
      handleCloseDetailsDialog();
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
      const lowerSearchQuery = searchQuery.toLowerCase().trim();
      const subtaskAssignees = getAssigneesForSubtask(subtask);
      const assigneeNames = subtaskAssignees.map((assignee) =>
        `${assignee.firstname} ${assignee.lastname}`.toLowerCase()
      );
      const matchesSearch =
        !lowerSearchQuery ||
        subtask.title.toLowerCase().includes(lowerSearchQuery) ||
        subtask.description.toLowerCase().includes(lowerSearchQuery) ||
        assigneeNames.some((name) => name.includes(lowerSearchQuery));
      const matchesStatus =
        statusFilter === "all" ||
        subtask.status.toLowerCase() === statusFilter.toLowerCase();
      const assignedIds = Array.isArray(subtask.assignedTo)
        ? subtask.assignedTo
        : [subtask.assignedTo].filter(Boolean);
      const matchesAssignee =
        assigneeFilter === "all" || assignedIds.includes(assigneeFilter);
      return matchesSearch && matchesStatus && matchesAssignee;
    })
    .sort((a, b) => {
      const aOverdue =
        new Date(a.deadline) < new Date() && a.status !== "Completed";
      const bOverdue =
        new Date(b.deadline) < new Date() && b.status !== "Completed";
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  // Helper: Get Completion Percentage
  const getCompletionPercentage = () => {
    if (!subtasks.length) return 0;
    const completed = subtasks.filter(
      (st) => st.status.toLowerCase() === "completed"
    ).length;
    return Math.round((completed / subtasks.length) * 100);
  };
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "in progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center hover:bg-blue-200">
            <Clock className="mr-1 w-3 h-3" /> In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center hover:bg-green-200">
            <Check className="mr-1 w-3 h-3" /> Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full flex items-center hover:bg-gray-200">
            <AlertCircle className="mr-1 w-3 h-3" /> Pending
          </Badge>
        );
      default:
        return (
          <Badge className="text-xs px-2 py-0.5 rounded-full">
            {status || "Unknown"}
          </Badge>
        );
    }
  };
  const getInitials = (firstname?: string, lastname?: string) => {
    if (!firstname) return "?";
    if (!lastname) return firstname.charAt(0).toUpperCase();
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };
  // --- Render Logic ---

  if (loading) {
    return (
      // --- SKELETON (Responsive) ---
      <div className="container mx-auto p-4 sm:p-6">
        <div className="animate-pulse">
          <Skeleton className="h-32 sm:h-40 w-full rounded-lg mb-6 sm:mb-8" />
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-36 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Skeleton className="h-9 w-full sm:w-48 rounded-md" />
              <Skeleton className="h-9 w-full sm:w-40 rounded-md" />
              <Skeleton className="h-9 w-full sm:w-36 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      // --- ERROR MESSAGE (Responsive) ---
      <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
        <Alert variant="destructive" className="mb-6 shadow-md">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-semibold">
            Error Loading Subtasks
          </AlertTitle>
          <AlertDescription className="mt-2">{error}</AlertDescription>
        </Alert>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
          <Button onClick={fetchSubtaskData} className="gap-2 shadow-sm">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {/* --- MAIN CONTENT AREA (Responsive Padding) --- */}
      <div className="container mx-auto p-4 sm:p-6">
        {/* --- PARENT TASK HEADER (Responsive) --- */}
        {parentTask && (
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-slate-50 to-gray-50 shadow-md backdrop-blur overflow-hidden">
            <CardHeader className="relative pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="h-8 w-8 rounded-full bg-white shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
              <CardTitle className="text-xl sm:text-2xl text-center pt-2 font-bold text-primary">
                Subtasks for: {parentTask.title}
              </CardTitle>
              {parentTask.description && (
                <CardDescription className="text-center text-sm text-muted-foreground px-4 mt-2 line-clamp-2">
                  {parentTask.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="mb-4">
                <Progress
                  value={getCompletionPercentage()}
                  className="h-2"
                  aria-label={`${getCompletionPercentage()}% of subtasks completed`}
                />
                <p className="text-xs text-center mt-1 text-muted-foreground">
                  {getCompletionPercentage()}% completed
                </p>
              </div>
              {/* Responsive Grid for Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                <div className="bg-white/50 p-3 rounded-md border border-gray-100 shadow-sm flex flex-col">
                  <span className="text-xs text-muted-foreground flex items-center mb-1">
                    <Calendar className="w-3 h-3 mr-1" /> Deadline
                  </span>
                  <span className="font-medium">
                    {parentTask.deadline
                      ? format(new Date(parentTask.deadline), "PPP")
                      : "—"}
                  </span>
                </div>
                <div className="bg-white/50 p-3 rounded-md border border-gray-100 shadow-sm flex flex-col">
                  <span className="text-xs text-muted-foreground flex items-center mb-1">
                    <Clock className="w-3 h-3 mr-1" /> Last Updated
                  </span>
                  <span className="font-medium">
                    {format(new Date(parentTask.updatedAt), "PP")}
                  </span>
                </div>
                <div className="bg-white/50 p-3 rounded-md border border-gray-100 shadow-sm flex justify-center items-center">
                  <Badge className="text-xs px-2 py-0.5 rounded-full">
                    {parentTask.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- ACTIONS & FILTERS BAR (Responsive & Sticky) --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 sticky top-16 sm:top-0 z-30 bg-background/90 backdrop-blur-sm p-3 -mx-3 rounded-lg shadow-sm border-b">
          {/* Left Side: Create / Select Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-start">
            {!isSelectionMode ? (
              <>
                <Button onClick={handleNavigateToCreate} size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Subtask
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectionMode}
                >
                  <Square className="mr-2 h-4 w-4" /> Select
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleSelectionMode}
                  disabled={isDeletingSelected}
                >
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={selectedSubtaskIds.size === 0 || isDeletingSelected}
                >
                  {isDeletingSelected ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete ({selectedSubtaskIds.size})
                </Button>
              </>
            )}
          </div>

          {/* Right Side: Filters (Responsive) */}
          <div
            className={cn(
              "flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto",
              isSelectionMode && "opacity-50 pointer-events-none"
            )}
          >
            {/* Search */}
            <div className="relative w-full sm:flex-1 md:flex-none md:w-48">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..." // Shorter placeholder
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full h-9 bg-background border focus-visible:ring-primary/20 transition-all"
                disabled={isSelectionMode}
              />
            </div>
            {/* Assignee Filter */}
            <Select
              value={assigneeFilter}
              onValueChange={setAssigneeFilter}
              disabled={isSelectionMode}
            >
              <SelectTrigger className="w-full sm:w-auto md:w-[160px] lg:w-[180px] h-9 text-xs sm:text-sm bg-background border focus-visible:ring-primary/20">
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
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              disabled={isSelectionMode}
            >
              <SelectTrigger className="w-full sm:w-auto md:w-[140px] lg:w-[160px] h-9 text-xs sm:text-sm bg-background border focus-visible:ring-primary/20">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            {/* Clear Filters Button */}
            {(searchQuery ||
              statusFilter !== "all" ||
              assigneeFilter !== "all") &&
              !isSelectionMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFilters}
                  className="h-9 w-9 flex-shrink-0 rounded-full hover:bg-muted"
                  aria-label="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
          </div>
        </div>

        {/* --- SUBTASK GRID (Responsive Columns) --- */}
        {subtasks.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-muted/20 rounded-lg border-2 border-dashed border-muted text-center mt-6">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted mb-3" />
            <h3 className="text-lg sm:text-xl font-medium mb-2">
              No Subtasks Created Yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create the first subtask for this main task.
            </p>
            <Button onClick={handleNavigateToCreate}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Subtask
            </Button>
          </div>
        ) : filteredAndSortedSubtasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-muted/20 rounded-lg border-2 border-dashed border-muted text-center mt-6">
            <Search className="w-10 h-10 sm:w-12 sm:h-12 text-muted mb-3" />
            <h3 className="text-lg sm:text-xl font-medium mb-2">
              No Matching Subtasks
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
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
              const assignees = getAssigneesForSubtask(subtask);
              return (
                <SubtaskCard
                  key={subtask.SubtaskId}
                  subtask={subtask}
                  assignees={assignees}
                  isSelected={selectedSubtaskIds.has(subtask.SubtaskId)}
                  isSelectionMode={isSelectionMode}
                  onCardClick={handleCardClick}
                  onUpdateClick={handleNavigateToUpdate}
                  onToggleSelect={handleToggleSelectSubtask}
                />
              );
            })}
          </div>
        )}

        {/* --- Subtask Details Dialog (Responsive) --- */}
        <Dialog
          open={!!viewSubtaskDetailsData && !isSelectionMode}
          onOpenChange={(open) => !open && handleCloseDetailsDialog()}
        >
          {/* Responsive Width & Height */}
          <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">
                  Subtask: {viewSubtaskDetailsData?.title}
                </span>
              </DialogTitle>
              <DialogDescription className="text-sm">
                Details, submission info, and leader actions.
              </DialogDescription>
            </DialogHeader>
            {viewSubtaskDetailsData && (
              // Scrollable Content Area
              <div className="flex-grow overflow-y-auto pr-4 -mr-4 sm:pr-6 sm:-mr-6">
                <div className="space-y-4 py-4 text-sm">
                  <div className="bg-muted/20 p-3 rounded-md">
                    <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Description
                    </Label>
                    <p className="whitespace-pre-line">
                      {viewSubtaskDetailsData.description}
                    </p>
                  </div>

                  {/* Responsive Grid for Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-muted/20 p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Deadline
                      </Label>
                      <p className="font-medium">
                        {format(
                          new Date(viewSubtaskDetailsData.deadline),
                          "PPP"
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(viewSubtaskDetailsData.deadline), "p")}
                      </p>
                    </div>
                    <div className="bg-muted/20 p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Status
                      </Label>
                      <div className="mt-1">
                        {getStatusBadge(viewSubtaskDetailsData.status)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/20 p-3 rounded-md">
                    <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Assigned To
                    </Label>
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                      {getAssigneesForSubtask(viewSubtaskDetailsData).length >
                      0 ? (
                        getAssigneesForSubtask(viewSubtaskDetailsData).map(
                          (m) => (
                            <div
                              key={m.UserId}
                              className="flex items-center space-x-2 bg-white/50 p-2 rounded-md"
                            >
                              <Avatar className="h-8 w-8 border-2 border-white shadow-sm flex-shrink-0">
                                <AvatarImage
                                  src={m.profilepic ?? ""}
                                  alt={`${m.firstname} ${m.lastname}`}
                                />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(m.firstname, m.lastname)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <span className="font-medium block truncate">
                                  {m.firstname} {m.lastname}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {m.email}
                                </span>
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <span className="italic text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>

                  {viewSubtaskDetailsData.gitHubUrl && (
                    <div className="bg-muted/20 p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Github className="w-3 h-3" /> Submitted GitHub URL
                      </Label>
                      <div className="flex items-center mt-1 bg-white/60 p-2 rounded border border-muted">
                        <a
                          href={viewSubtaskDetailsData.gitHubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm break-all flex-1 truncate mr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {viewSubtaskDetailsData.gitHubUrl}
                        </a>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                viewSubtaskDetailsData.gitHubUrl,
                                "_blank"
                              );
                            }}
                            className="h-7 w-7 rounded-full"
                            aria-label="Open URL"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(viewSubtaskDetailsData.gitHubUrl);
                            }}
                            className="h-7 w-7 rounded-full"
                            aria-label="Copy URL"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {viewSubtaskDetailsData.context && (
                    <div className="bg-muted/20 p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Submitted Context / Notes
                      </Label>
                      <div className="mt-1 bg-white/60 p-2 rounded border border-muted max-h-40 overflow-y-auto">
                        <p className="whitespace-pre-line text-sm">
                          {viewSubtaskDetailsData.context}
                        </p>
                      </div>
                    </div>
                  )}

                  {isMarkingPending && (
                    <div className="space-y-1 pt-4 border-t">
                      <Label
                        htmlFor="pending-feedback"
                        className="flex items-center text-sm font-medium text-destructive"
                      >
                        <AlertTriangle className="w-4 h-4 mr-1.5" /> Feedback
                        for Rejection (Required)
                      </Label>
                      <Textarea
                        id="pending-feedback"
                        value={pendingFeedback}
                        onChange={(e) => setPendingFeedback(e.target.value)}
                        placeholder="Provide clear reasons why this submission is being marked as pending..."
                        className="min-h-[100px]"
                        required
                        disabled={isProcessingStatusChange}
                      />
                      {pendingFeedback.trim() === "" && (
                        <p className="text-xs text-red-600">
                          Feedback is required to mark as pending.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Dialog Footer (Responsive Buttons) */}
            <DialogFooter className="pt-4 mt-auto border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCloseDetailsDialog}
                disabled={isProcessingStatusChange}
                className="w-full sm:w-auto"
              >
                Close
              </Button>

              {viewSubtaskDetailsData && !isMarkingPending && (
                <Button
                  onClick={() =>
                    handleNavigateToUpdate(viewSubtaskDetailsData.SubtaskId)
                  }
                  disabled={isProcessingStatusChange}
                  className="w-full sm:w-auto"
                >
                  <FileEdit className="mr-2 h-4 w-4" /> Edit Subtask
                </Button>
              )}

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
                        className="w-full sm:w-auto"
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
                        className="w-full sm:w-auto"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" /> Mark Pending
                      </Button>
                    )}
                  </>
                )}

              {viewSubtaskDetailsData &&
                viewSubtaskDetailsData.status === "In Progress" &&
                !isMarkingPending && (
                  <Button
                    onClick={handleMarkSubtaskCompleted}
                    disabled={isProcessingStatusChange}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
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

        {/* --- Confirmation Dialog for Mark Pending (Responsive) --- */}
        <AlertDialog
          open={showSubtaskMarkPendingConfirm}
          onOpenChange={setShowSubtaskMarkPendingConfirm}
        >
          <AlertDialogContent className="w-[95vw] max-w-md">
            <AlertDialogHeaderAlias>
              <AlertDialogTitleAlias className="flex items-center text-lg">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                Confirm Mark as Pending
              </AlertDialogTitleAlias>
              <AlertDialogDescriptionAlias className="text-sm">
                Are you sure you want to mark this subtask as pending? This will
                clear submission data and require rework based on your feedback.
                <p className="mt-2 font-medium">Feedback:</p>
                <p className="text-xs sm:text-sm text-muted-foreground p-2 border rounded bg-muted/50 max-h-32 overflow-y-auto">
                  {pendingFeedback || "(No feedback provided)"}
                </p>
              </AlertDialogDescriptionAlias>
            </AlertDialogHeaderAlias>
            <AlertDialogFooterAlias className="flex-col-reverse sm:flex-row">
              <AlertDialogCancel
                onClick={() => setShowSubtaskMarkPendingConfirm(false)}
                disabled={isProcessingStatusChange}
                className="w-full sm:w-auto"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={executeMarkSubtaskPending}
                disabled={isProcessingStatusChange}
                className="bg-destructive hover:bg-destructive/90 w-full sm:w-auto"
              >
                {isProcessingStatusChange ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirm Rejection
              </AlertDialogAction>
            </AlertDialogFooterAlias>
          </AlertDialogContent>
        </AlertDialog>

        {/* --- Confirmation Dialog for BATCH DELETE (Responsive) --- */}
        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
        >
          <AlertDialogContent className="w-[95vw] max-w-md">
            <AlertDialogHeaderAlias>
              <AlertDialogTitleAlias className="flex items-center text-lg">
                <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
                Confirm Deletion
              </AlertDialogTitleAlias>
              <AlertDialogDescriptionAlias className="text-sm">
                Are you sure you want to permanently delete the selected{" "}
                {selectedSubtaskIds.size} subtask(s)? This action cannot be
                undone.
              </AlertDialogDescriptionAlias>
            </AlertDialogHeaderAlias>
            <AlertDialogFooterAlias className="flex-col-reverse sm:flex-row">
              <AlertDialogCancel
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingSelected}
                className="w-full sm:w-auto"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSelected}
                disabled={isDeletingSelected}
                className="bg-destructive hover:bg-destructive/90 w-full sm:w-auto"
              >
                {isDeletingSelected ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete {selectedSubtaskIds.size} Subtask(s)
              </AlertDialogAction>
            </AlertDialogFooterAlias>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
