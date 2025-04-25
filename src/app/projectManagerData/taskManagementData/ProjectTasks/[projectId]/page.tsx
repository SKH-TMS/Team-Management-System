"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { format } from "date-fns"; // Import date-fns for formatting

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ClipboardList,
  Copy,
  FileEdit,
  Github,
  LayoutGrid,
  LayoutList,
  Loader2,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
  User,
  Users,
  X,
  XCircle,
  Briefcase, // Added for Project icon
  Calendar, // Added for Deadline icon
  MessageSquare, // Added for Description/Context icon
  Eye, // Added for View/Review icon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { cn } from "@/lib/utils"; // Import cn if needed for TaskCard styling

// Interfaces
interface Task {
  TaskId: string;
  title: string;
  description: string;
  deadline: string; // Keep as string if API returns string
  status: string;
  createdAt: string; // Keep as string if API returns string
  updatedAt: string; // Keep as string if API returns string
  gitHubUrl?: string;
  context?: string;
  submittedby?: string;
  projectId: string;
  projectName: string;
  teamId: string;
  teamName: string;
}

interface Submitter {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

// Props for confirmation dialog (can be kept if needed elsewhere, or removed if only used here)
// interface UpdateConfirmDialogProps { ... }

export default function ManageTasksPage() {
  const [markpending, setmarkpending] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [feedback, setfeedback] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitters, setSubmitters] = useState<Submitter[]>([]);
  const router = useRouter();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [taskModalData, setTaskModalData] = useState<Task | null>(null); // State for modal data
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMarkPendingConfirm, setShowMarkPendingConfirm] = useState(false);

  // State for the update confirmation dialog
  const [updateConfirmDialog, setUpdateConfirmDialog] = useState<{
    isOpen: boolean;
    taskId: string;
    projectId: string;
    status: string;
  }>({
    isOpen: false,
    taskId: "",
    projectId: "",
    status: "",
  });

  // Fetch Tasks
  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        "/api/projectManagerData/taskManagementData/getTasks",
        { method: "GET" }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        setTasks(data.tasks || []);
        setSubmitters(data.submitters || []);
      } else {
        throw new Error(data.message || "Failed to fetch tasks.");
      }
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      const errorMessage =
        err.message || "Failed to fetch tasks. Please try again later.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Copy to Clipboard
  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("GitHub URL copied to clipboard!");
    });
  };

  // Close Modal Handler
  const handleCloseModal = () => {
    setTaskModalData(null);
    setmarkpending(false);
    setfeedback("");
  };

  // Mark Pending Handlers
  const handleMarkPending = async () => {
    if (!taskModalData) return;
    if (feedback.trim() === "") {
      toast.error("Please enter feedback");
      return;
    }
    setShowMarkPendingConfirm(true);
  };

  const confirmMarkPending = async () => {
    if (!taskModalData || feedback.trim() === "") return;
    // Add submitting state?
    try {
      const response = await fetch(
        `/api/projectManagerData/taskManagementData/markTaskPending/${taskModalData.TaskId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);

      toast.success("Task marked as pending!");
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.TaskId === taskModalData.TaskId
            ? { ...task, status: "Re Assigned", context: feedback }
            : task
        )
      );
      handleCloseModal();
    } catch (error: any) {
      console.error("Error marking task as pending:", error);
      toast.error(error.message || "Failed to mark task as pending.");
    } finally {
      setShowMarkPendingConfirm(false);
      // Stop submitting state
    }
  };

  // Mark Completed Handler
  const handleMarkCompleted = async () => {
    if (!taskModalData) return;
    // Add submitting state?
    try {
      const response = await fetch(
        `/api/projectManagerData/taskManagementData/markTaskCompleted/${taskModalData.TaskId}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);

      toast.success("Task marked as completed!");
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.TaskId === taskModalData.TaskId
            ? { ...task, status: "Completed" }
            : task
        )
      );
      handleCloseModal();
    } catch (error: any) {
      console.error("Error marking task as completed:", error);
      toast.error(error.message || "Failed to mark task as completed.");
    } finally {
      // Stop submitting state
    }
  };

  // Status Helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "Re Assigned":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  const getCardBgColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-gray-50 border-gray-200";
      case "In Progress":
        return "bg-blue-50 border-blue-200";
      case "Completed":
        return "bg-green-50 border-green-200";
      case "Re Assigned":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-card border";
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-3 w-3" />;
      case "In Progress":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "Completed":
        return <CheckCircle2 className="h-3 w-3" />;
      case "Re Assigned":
        return <RefreshCw className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Update Task Navigation
  const handleUpdateTask = (
    taskId: string,
    status: string,
    projectId: string
  ) => {
    if (status === "Completed" || status === "In Progress") {
      setUpdateConfirmDialog({ isOpen: true, taskId, projectId, status });
    } else {
      router.push(
        `/projectManagerData/taskManagementData/ManageTasks/updateTask/${projectId}/${taskId}`
      );
    }
  };
  const handleConfirmUpdate = () => {
    const { taskId, projectId } = updateConfirmDialog;
    setUpdateConfirmDialog({ ...updateConfirmDialog, isOpen: false });
    router.push(
      `/projectManagerData/taskManagementData/ManageTasks/updateTask/${projectId}/${taskId}`
    );
  };

  // Delete Task Handlers
  const handleDeleteSelectedTasks = async () => {
    if (selectedTaskIds.length === 0) return;
    setShowDeleteConfirm(true);
  };
  const confirmDeleteSelectedTasks = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        "/api/projectManagerData/taskManagementData/deleteSelectedTasks",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskIds: selectedTaskIds }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);

      toast.success(data.message || "Selected tasks deleted successfully!");
      setTasks((prevTasks) =>
        prevTasks.filter((task) => !selectedTaskIds.includes(task.TaskId))
      );
      setSelectedTaskIds([]);
      setIsSelectMode(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tasks.");
    } finally {
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  };

  // Filtering and Sorting
  const filteredTasks = tasks.filter((task) => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      task.title.toLowerCase().includes(lowerSearchQuery) ||
      task.description.toLowerCase().includes(lowerSearchQuery) ||
      task.projectName?.toLowerCase().includes(lowerSearchQuery) ||
      task.teamName?.toLowerCase().includes(lowerSearchQuery);
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const statusOrder: { [key: string]: number } = {
      "Re Assigned": 1,
      Pending: 2,
      "In Progress": 3,
      Completed: 4,
    };
    return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
  });

  // Handler to open modal specifically for reviewing submission
  const handleReviewSubmission = (task: Task) => {
    setTaskModalData(task);
  };

  // Handler for clicking the task card (opens modal or selects)
  const handleTaskClick = (task: Task) => {
    if (isSelectMode) {
      // Selection handled by checkbox click
    } else {
      setTaskModalData(task); // Open the details modal for general viewing
    }
  };

  // Selection Handlers
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };
  const handleToggleSelectMode = () => {
    if (isSelectMode) setSelectedTaskIds([]);
    setIsSelectMode(!isSelectMode);
  };

  // Navigation
  const handleCreateTask = () => {
    router.push("/projectManagerData/taskManagementData/CreateTask");
  };

  // Loading and Error States
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" /> <AlertTitle>Error</AlertTitle>{" "}
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={fetchTasks}>
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-center md:text-left">
          Manage All Tasks
        </h1>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks, projects, teams..."
              className="pl-8 w-full md:w-[200px] lg:w-[300px] h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            aria-label={
              viewMode === "grid"
                ? "Switch to list view"
                : "Switch to grid view"
            }
            className="h-9 w-9"
          >
            {viewMode === "grid" ? (
              <LayoutList className="h-4 w-4" />
            ) : (
              <LayoutGrid className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Action Buttons & Filters */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <Button onClick={handleCreateTask} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Create Task
        </Button>
        <Button
          variant={isSelectMode ? "secondary" : "outline"}
          size="sm"
          onClick={handleToggleSelectMode}
        >
          {isSelectMode ? (
            <X className="mr-2 h-4 w-4" />
          ) : (
            <Users className="mr-2 h-4 w-4" />
          )}
          {isSelectMode ? "Cancel" : "Select"}
        </Button>
        {isSelectMode && selectedTaskIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelectedTasks}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedTaskIds.length}
            )
          </Button>
        )}
        <div className="ml-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] text-sm h-9">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Re Assigned">Re-Assigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task Count & Clear Filters */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {sortedTasks.length} task{sortedTasks.length !== 1 ? "s" : ""}
        {tasks.length !== sortedTasks.length && ` of ${tasks.length}`}
        {(searchQuery || statusFilter !== "all") && (
          <Button
            variant="link"
            size="sm"
            className="ml-2 h-auto p-0 text-primary"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Task List/Grid */}
      {sortedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-muted-foreground mt-2 max-w-xs">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters."
              : "No tasks match the current criteria, or no tasks have been created yet."}
          </p>
          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        // --- Grid View ---
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {sortedTasks.map((task) => (
            <Card
              key={task.TaskId}
              className={`overflow-hidden transition-all duration-200 group relative border ${getCardBgColor(task.status)} ${selectedTaskIds.includes(task.TaskId) ? "ring-2 ring-primary shadow-lg" : "hover:-translate-y-1"} ${!isSelectMode ? "cursor-pointer" : isSelectMode ? "cursor-default" : ""}`}
              onClick={() => handleTaskClick(task)} // Card click opens modal
            >
              <CardHeader className="pb-3 relative">
                {isSelectMode && (
                  <div
                    className="absolute left-3 top-3 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedTaskIds.includes(task.TaskId)}
                      onCheckedChange={() => toggleTaskSelection(task.TaskId)}
                      aria-label={`Select task ${task.title}`}
                    />
                  </div>
                )}
                <div className="flex justify-between items-start gap-2">
                  <CardTitle
                    className={`text-lg line-clamp-2 break-words ${isSelectMode ? "pl-8" : ""}`}
                  >
                    {task.title}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`flex-shrink-0 text-xs px-1.5 py-0.5 ${getStatusColor(task.status)}`}
                  >
                    {getStatusIcon(task.status)}{" "}
                    <span className="ml-1 hidden sm:inline">{task.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3 text-sm space-y-2">
                <p className="text-muted-foreground line-clamp-3 mb-3">
                  {task.description}
                </p>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-muted-foreground truncate">
                    <span className="font-medium text-card-foreground">
                      Project:{" "}
                    </span>
                    {task.projectName || "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-muted-foreground truncate">
                    <span className="font-medium text-card-foreground">
                      Team:{" "}
                    </span>
                    {task.teamName || "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-card-foreground">
                      Due:{" "}
                    </span>
                    {format(new Date(task.deadline), "PP")}
                  </p>
                </div>
              </CardContent>
              <Separator className="my-2" />
              <CardFooter className="pt-2 pb-3 flex justify-between items-center gap-2">
                {" "}
                {/* justify-between */}
                <div className="flex-grow">
                  {" "}
                  {/* Allow button to take space */}
                  {(task.status === "In Progress" ||
                    task.status === "Completed") && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-primary hover:text-primary/80 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReviewSubmission(task);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      {task.status === "Completed"
                        ? "View Submission"
                        : "Review Submission"}
                    </Button>
                  )}
                </div>
                {!isSelectMode && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateTask(
                        task.TaskId,
                        task.status,
                        task.projectId
                      );
                    }}
                    aria-label="Update Task"
                  >
                    <FileEdit className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        // --- List View ---
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <div
              key={task.TaskId}
              className={`flex flex-col md:flex-row gap-4 p-4 rounded-lg border group transition-all ${getCardBgColor(task.status)} ${selectedTaskIds.includes(task.TaskId) ? "ring-2 ring-primary shadow-md" : "hover:shadow-md"} ${!isSelectMode ? "cursor-pointer" : isSelectMode ? "cursor-default" : ""}`}
              onClick={() => handleTaskClick(task)} // Card click opens modal
            >
              {isSelectMode && (
                <div
                  className="flex-shrink-0 pr-4 pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedTaskIds.includes(task.TaskId)}
                    onCheckedChange={() => toggleTaskSelection(task.TaskId)}
                    aria-label={`Select task ${task.title}`}
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="text-lg font-medium break-words">
                    {task.title}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 flex-shrink-0 ${getStatusColor(task.status)}`}
                  >
                    {getStatusIcon(task.status)}{" "}
                    <span className="ml-1">{task.status}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 mb-3 line-clamp-2">
                  {task.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground truncate">
                      <span className="font-medium text-card-foreground">
                        Project:{" "}
                      </span>
                      {task.projectName || "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground truncate">
                      <span className="font-medium text-card-foreground">
                        Team:{" "}
                      </span>
                      {task.teamName || "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground">
                      <span className="font-medium text-card-foreground">
                        Due:{" "}
                      </span>
                      {format(new Date(task.deadline), "PPp")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-row md:flex-col justify-end items-center md:items-end gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-border/50 md:pl-4">
                {(task.status === "In Progress" ||
                  task.status === "Completed") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full md:w-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReviewSubmission(task);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    {task.status === "Completed"
                      ? "View Submission"
                      : "Review Submission"}
                  </Button>
                )}
                {!isSelectMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full md:w-auto hover:bg-accent hover:text-accent-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateTask(
                        task.TaskId,
                        task.status,
                        task.projectId
                      );
                    }}
                  >
                    <FileEdit className="mr-2 h-4 w-4" /> Update
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Task Details Dialog --- */}
      <Dialog
        open={!!taskModalData}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {taskModalData?.title || "Task Details"}
              {taskModalData?.status && (
                <Badge
                  variant="outline"
                  className={`ml-auto ${getStatusColor(taskModalData.status)}`}
                >
                  {getStatusIcon(taskModalData.status)}{" "}
                  <span className="ml-1">{taskModalData.status}</span>
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {taskModalData && (
            <div className="space-y-4 py-4 text-sm">
              {/* Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Project
                  </Label>
                  <p>{taskModalData.projectName || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Users className="w-3.5 h-3.5 mr-1.5" /> Team
                  </Label>
                  <p>{taskModalData.teamName || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" /> Deadline
                  </Label>
                  <p>{format(new Date(taskModalData.deadline), "PPPp")}</p>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 mr-1.5" /> Last Updated
                  </Label>
                  <p>{format(new Date(taskModalData.updatedAt), "PPp")}</p>
                </div>
              </div>
              <Separator />
              {/* Description */}
              <div className="space-y-1">
                <Label
                  htmlFor="modal-description"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Description
                </Label>
                <Textarea
                  id="modal-description"
                  value={taskModalData.description}
                  readOnly
                  className="min-h-[80px] bg-muted/30 border-none"
                />
              </div>
              {/* Submission Details (Conditional) */}
              {(taskModalData.submittedby &&
                taskModalData.submittedby !== "Not-submitted") ||
              taskModalData.status === "Completed" ||
              taskModalData.status === "Re Assigned" ? (
                <>
                  <Separator />
                  <h4 className="text-base font-semibold pt-2">
                    {taskModalData.status === "Re Assigned"
                      ? "Previous Submission / Feedback"
                      : "Submission Details"}
                  </h4>
                  <div className="space-y-3 pl-2 border-l-2">
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs font-medium text-muted-foreground">
                        <User className="w-3.5 h-3.5 mr-1.5" /> Submitted By
                      </Label>
                      <p className="text-sm">
                        {taskModalData.submittedby &&
                        taskModalData.submittedby !== "Not-submitted"
                          ? (() => {
                              const s = submitters.find(
                                (sub) =>
                                  sub.UserId === taskModalData.submittedby
                              );
                              return s
                                ? `${s.firstname} ${s.lastname} (${s.email})`
                                : `User ID: ${taskModalData.submittedby}`;
                            })()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="modal-github-url"
                        className="flex items-center text-xs font-medium text-muted-foreground"
                      >
                        <Github className="w-3.5 h-3.5 mr-1.5" /> GitHub URL
                      </Label>
                      {taskModalData.gitHubUrl ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            id="modal-github-url"
                            value={taskModalData.gitHubUrl}
                            readOnly
                            className="font-mono text-xs h-8 flex-1 bg-muted/30 border-none"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() =>
                              copyToClipboard(taskModalData.gitHubUrl || "")
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
                        htmlFor="modal-context"
                        className="flex items-center text-xs font-medium text-muted-foreground"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />{" "}
                        {taskModalData.status === "Re Assigned"
                          ? "Feedback Provided"
                          : "Explanation/Context"}
                      </Label>
                      <Textarea
                        id="modal-context"
                        value={
                          taskModalData.context ||
                          (taskModalData.status === "Re Assigned"
                            ? "No feedback recorded."
                            : "No explanation provided.")
                        }
                        readOnly
                        className={`min-h-[80px] text-sm bg-muted/30 border-none ${taskModalData.status === "Re Assigned" ? "border-l-4 border-amber-400 pl-3" : ""}`}
                      />
                    </div>
                  </div>
                </>
              ) : null}
              {/* Feedback Input Area (Only shown when marking pending) */}
              {markpending && (
                <div className="space-y-1 pt-4 border-t">
                  <Label
                    htmlFor="feedback"
                    className="flex items-center text-sm font-medium text-destructive"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1.5" /> Feedback for
                    Rejection (Required)
                  </Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setfeedback(e.target.value)}
                    placeholder="Provide clear reasons..."
                    className="min-h-[100px]"
                    required
                  />
                  {feedback.trim() === "" && (
                    <p className="text-xs text-red-600">Feedback is required</p>
                  )}
                </div>
              )}
              {/* Dialog Footer with Actions */}
              <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4 mt-4 border-t">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                {taskModalData.status === "In Progress" && !markpending && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => setmarkpending(true)}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" /> Mark Pending
                    </Button>
                    <Button variant="default" onClick={handleMarkCompleted}>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Completed
                    </Button>
                  </>
                )}
                {taskModalData.status === "Completed" && !markpending && (
                  <Button
                    variant="destructive"
                    onClick={() => setmarkpending(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" /> Mark Pending
                  </Button>
                )}
                {markpending && (
                  <Button
                    variant="destructive"
                    onClick={handleMarkPending}
                    disabled={feedback.trim() === ""}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" /> Confirm Rejection
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />{" "}
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTaskIds.length} selected
              task(s)? This action cannot be undone and will remove the task(s)
              from the project assignment log.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSelectedTasks}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Task(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Pending Confirmation Dialog */}
      <Dialog
        open={showMarkPendingConfirm}
        onOpenChange={setShowMarkPendingConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" /> Confirm
              Mark as Pending
            </DialogTitle>
            <DialogDescription>
              This will mark the task as 'Re Assigned' and clear any previous
              submission data (GitHub URL, context). The team will be notified.
              Please provide feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 py-4">
            <Label htmlFor="confirm-feedback" className="font-medium">
              Feedback (Required)
            </Label>
            <Textarea
              id="confirm-feedback"
              value={feedback}
              onChange={(e) => setfeedback(e.target.value)}
              placeholder="Provide clear reasons..."
              className="min-h-[100px]"
              required
            />
            {feedback.trim() === "" && (
              <p className="text-xs text-red-600">Feedback is required</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMarkPendingConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmMarkPending}
              disabled={feedback.trim() === ""}
            >
              Confirm Mark Pending
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Confirmation Dialog */}
      <Dialog
        open={updateConfirmDialog.isOpen}
        onOpenChange={(open) =>
          !open &&
          setUpdateConfirmDialog({ ...updateConfirmDialog, isOpen: false })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" /> Confirm
              Task Update
            </DialogTitle>
            <DialogDescription>
              This task is currently '{updateConfirmDialog.status}'. Updating it
              may require the team to redo work or adjust their progress. Are
              you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setUpdateConfirmDialog({
                  ...updateConfirmDialog,
                  isOpen: false,
                })
              }
            >
              Cancel
            </Button>
            <Button variant="default" onClick={handleConfirmUpdate}>
              <FileEdit className="mr-2 h-4 w-4" /> Continue to Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
