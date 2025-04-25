"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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
  User, // Keep User icon for Submitter display
  Users, // Keep Users icon for Team display and Select Tasks button
  X,
  XCircle,
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
// Removed Tooltip imports as they were primarily for assignedTo avatars
import { Label } from "@/components/ui/label";
// Removed Avatar imports

// Updated Task Interface: Removed assignedTo
interface Task {
  TaskId: string;
  title: string;
  description: string;
  // assignedTo: string[]; // Removed this line
  deadline: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  gitHubUrl?: string;
  context?: string;
  submittedby?: string; // This likely refers to the Team Leader submitting the overall task
  // Flattened assignment details (from backend API):
  projectId: string;
  projectName: string;
  teamId: string;
  teamName: string;
}

// Interface for submitter details (likely Team Leaders or designated submitters)
interface Submitter {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string; // Keep profile pic for submitter if needed
  email: string;
}

// UpdateConfirmDialogProps remains the same for now
interface UpdateConfirmDialogProps {
  taskId: string;
  projectId: string;
  status: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ManageTasksPage() {
  const [markpending, setmarkpending] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [feedback, setfeedback] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [taskColour, settaskColour] = useState("");
  // const [members, setMembers] = useState<Member[]>([]); // Removed members state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitters, setSubmitters] = useState<Submitter[]>([]); // Renamed Member -> Submitter for clarity
  const router = useRouter();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMarkPendingConfirm, setShowMarkPendingConfirm] = useState(false);

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

  const fetchTasks = async () => {
    setLoading(true); // Ensure loading state is true at the start
    setError(""); // Clear previous errors
    try {
      // API endpoint remains the same for now, backend needs update
      const response = await fetch(
        "/api/projectManagerData/taskManagementData/getTasks",
        { method: "GET" }
      );
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
        // setMembers(data.members); // Removed: No longer setting members
        setSubmitters(data.submitters || []); // Set submitters, handle if API doesn't return it yet
      } else {
        setError(data.message || "Failed to fetch tasks.");
        toast.error(data.message || "Failed to fetch tasks.");
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      const errorMessage = "Failed to fetch tasks. Please try again later.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      // Use finally to ensure loading is set to false regardless of success/error
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("GitHub URL copied to clipboard!");
    });
  };

  const handleViewExplanationClick = (task: Task, colour: string) => {
    settaskColour(colour);
    setSelectedTaskDetails(task);
  };

  const handleCloseModal = () => {
    setSelectedTaskDetails(null);
    setmarkpending(false);
    setfeedback("");
  };

  // --- handleMarkPending, handleMarkCompleted ---
  // These functions interact with APIs that operate on the Task status.
  // The frontend logic here remains the same. The backend API needs to
  // ensure it handles the task status correctly in the new model.
  const handleMarkPending = async () => {
    if (!selectedTaskDetails) return;

    if (feedback.trim() === "") {
      // Use trim() to check for empty or whitespace-only feedback
      toast.error("Please enter feedback");
      return;
    }

    // Show confirmation dialog first
    setShowMarkPendingConfirm(true);
  };

  const confirmMarkPending = async () => {
    if (!selectedTaskDetails || feedback.trim() === "") return;

    try {
      const response = await fetch(
        `/api/projectManagerData/taskManagementData/markTaskPending/${selectedTaskDetails.TaskId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback }),
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success("Task marked as pending!");
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.TaskId === selectedTaskDetails.TaskId
              ? { ...task, status: "Re Assigned" } // Usually marking pending means Re Assigned
              : task
          )
        );
        handleCloseModal(); // Close the main modal
        setShowMarkPendingConfirm(false); // Close the confirmation dialog
      } else {
        toast.error(data.message || "Failed to mark task as pending.");
        // Consider if redirecting is always the best UX here
        // router.push("/projectManagerData/ProfileProjectManager");
      }
    } catch (error) {
      console.error("Error marking task as pending:", error);
      toast.error("Failed to mark task as pending.");
      // Consider if redirecting is always the best UX here
      // router.push("/projectManagerData/ProfileProjectManager");
    }
  };

  const handleMarkCompleted = async () => {
    if (!selectedTaskDetails) return;

    try {
      const response = await fetch(
        `/api/projectManagerData/taskManagementData/markTaskCompleted/${selectedTaskDetails.TaskId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success("Task marked as completed!");
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.TaskId === selectedTaskDetails.TaskId
              ? { ...task, status: "Completed" }
              : task
          )
        );
        handleCloseModal(); // Close the modal on success
      } else {
        toast.error(data.message || "Failed to mark task as completed.");
      }
    } catch (error) {
      console.error("Error marking task as completed:", error);
      toast.error("Failed to mark task as completed.");
    }
  };
  // --- End handleMarkPending, handleMarkCompleted ---

  // --- getStatusColor, getCardBgColor, getStatusIcon ---
  // These helpers are based on task.status and remain unchanged.
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Re Assigned":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCardBgColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-gray-50";
      case "In Progress":
        return "bg-blue-50";
      case "Completed":
        return "bg-green-50";
      case "Re Assigned":
        return "bg-amber-50";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "In Progress":
        return <Loader2 className="h-4 w-4 animate-spin" />; // Added animate-spin
      case "Completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "Re Assigned":
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  // --- End Status Helpers ---

  // --- handleUpdateTask, handleConfirmUpdate ---
  // Logic for navigating to the update page remains the same.
  // The update page itself (/updateTask/...) will need changes later.
  const handleUpdateTask = (
    taskId: string,
    status: string,
    projectId: string
  ) => {
    // Keep the confirmation dialog logic as it warns about overriding progress
    if (status === "Completed" || status === "In Progress") {
      setUpdateConfirmDialog({
        isOpen: true,
        taskId,
        projectId,
        status,
      });
    } else {
      // Navigate directly for Pending or Re Assigned tasks
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
  // --- End Update Task Logic ---

  // --- handleDeleteSelectedTasks ---
  // Frontend logic is okay. The backend API needs to be updated
  // to also remove TaskIds from the AssignedProjectLog.
  const handleDeleteSelectedTasks = async () => {
    if (selectedTaskIds.length === 0) return;
    setShowDeleteConfirm(true); // Show confirmation dialog first
  };

  const confirmDeleteSelectedTasks = async () => {
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
      if (data.success) {
        toast.success("Selected tasks deleted successfully!");
        setTasks((prevTasks) =>
          prevTasks.filter((task) => !selectedTaskIds.includes(task.TaskId))
        );
        setSelectedTaskIds([]);
        setIsSelectMode(false); // Exit select mode after deletion
      } else {
        toast.error(data.message || "Failed to delete tasks.");
      }
    } catch (error) {
      toast.error("Failed to delete tasks. Please try again.");
    } finally {
      setShowDeleteConfirm(false); // Close confirmation dialog
    }
  };
  // --- End Delete Task Logic ---

  // --- Filtering and Sorting ---
  // Logic remains the same, based on task properties.
  const filteredTasks = tasks.filter((task) => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      task.title.toLowerCase().includes(lowerSearchQuery) ||
      task.description.toLowerCase().includes(lowerSearchQuery) ||
      task.projectName?.toLowerCase().includes(lowerSearchQuery) || // Added optional chaining
      task.teamName?.toLowerCase().includes(lowerSearchQuery); // Added optional chaining

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Added [...filteredTasks] to avoid mutating the original filtered array
    const statusOrder: { [key: string]: number } = {
      "Re Assigned": 1,
      Pending: 2,
      "In Progress": 3,
      Completed: 4,
    };
    return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5); // Added default value
  });
  // --- End Filtering and Sorting ---

  // --- Selection Logic ---
  // handleTaskClick, toggleTaskSelection, handleToggleSelectMode remain the same.
  const handleTaskClick = (taskId: string) => {
    if (isSelectMode) {
      toggleTaskSelection(taskId);
    }
    // Optionally, you could navigate to a task detail view if not in select mode
    // else { router.push(`/projectManagerData/taskManagementData/Tasks/${taskId}`); }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prevSelectedIds) =>
      prevSelectedIds.includes(taskId)
        ? prevSelectedIds.filter((id) => id !== taskId)
        : [...prevSelectedIds, taskId]
    );
  };

  const handleToggleSelectMode = () => {
    if (isSelectMode) {
      setSelectedTaskIds([]); // Clear selection when exiting select mode
    }
    setIsSelectMode(!isSelectMode);
  };
  // --- End Selection Logic ---

  // --- Navigation ---
  // handleCreateTask navigates to the create page. This page will need updates.
  const handleCreateTask = () => {
    router.push("/projectManagerData/taskManagementData/CreateTask");
  };
  // --- End Navigation ---

  // Removed getInitials function

  // --- Loading and Error States ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        {" "}
        {/* Use min-h for better layout */}
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={fetchTasks}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }
  // --- End Loading and Error States ---

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
              className="pl-8 w-full md:w-[200px] lg:w-[300px]" // Responsive width
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
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Task
        </Button>
        <Button
          variant={isSelectMode ? "secondary" : "outline"} // Adjusted variant
          size="sm"
          onClick={handleToggleSelectMode}
        >
          {isSelectMode ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              Select
            </>
          )}
        </Button>

        {isSelectMode && selectedTaskIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelectedTasks} // Changed to show confirm dialog first
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedTaskIds.length})
          </Button>
        )}

        <div className="ml-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] text-sm">
              {" "}
              {/* Responsive width & size */}
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
            variant="link" // Use link variant for less emphasis
            size="sm"
            className="ml-2 h-auto p-0 text-primary" // Adjust styling
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
          {" "}
          {/* Added xl breakpoint */}
          {sortedTasks.map((task) => (
            <Card
              key={task.TaskId}
              className={`overflow-hidden transition-all duration-200 hover:shadow-lg group relative ${getCardBgColor(task.status)} ${
                selectedTaskIds.includes(task.TaskId)
                  ? "ring-2 ring-primary shadow-lg" // Enhanced selected style
                  : "hover:-translate-y-1" // Apply hover effect only if not selected
              } ${isSelectMode ? "cursor-pointer" : ""}`} // Add pointer cursor in select mode
              onClick={() => handleTaskClick(task.TaskId)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg line-clamp-2 break-words">
                    {" "}
                    {/* Allow wrapping */}
                    {task.title}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`flex-shrink-0 text-xs px-1.5 py-0.5 ${getStatusColor(task.status)}`} // Smaller badge
                  >
                    {getStatusIcon(task.status)}
                    <span className="ml-1 hidden sm:inline">
                      {task.status}
                    </span>{" "}
                    {/* Hide text on very small screens */}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3 text-sm space-y-2">
                <p className="text-muted-foreground line-clamp-3 mb-3">
                  {task.description}
                </p>

                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                    {new Date(task.deadline).toLocaleDateString("en-US", {
                      // Simplified date format for grid
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* REMOVED Assigned To Section */}
              </CardContent>
              <Separator className="my-2" />
              <CardFooter className="pt-2 pb-3 flex justify-end items-center gap-2">
                {/* Action Buttons - Conditionally shown */}
                {(task.status === "In Progress" ||
                  task.status === "Completed") && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-primary text-xs"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      handleViewExplanationClick(
                        task,
                        getCardBgColor(task.status)
                      );
                    }}
                  >
                    View Details
                  </Button>
                )}
                {/* Update button always visible on hover/focus when not in select mode */}
                {!isSelectMode && (
                  <Button
                    size="icon" // Use icon button for smaller footprint
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
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
              className={`flex flex-col md:flex-row gap-4 p-4 rounded-lg border group transition-all ${getCardBgColor(task.status)} ${
                selectedTaskIds.includes(task.TaskId)
                  ? "ring-2 ring-primary shadow-md" // Enhanced selected style
                  : "hover:shadow-md"
              } ${isSelectMode ? "cursor-pointer" : ""}`} // Add pointer cursor in select mode
              onClick={() => handleTaskClick(task.TaskId)}
            >
              {/* Main Content Area */}
              <div className="flex-1">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="text-lg font-medium break-words">
                    {task.title}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 flex-shrink-0 ${getStatusColor(task.status)}`}
                  >
                    {getStatusIcon(task.status)}
                    <span className="ml-1">{task.status}</span>
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mt-1 mb-3 line-clamp-2">
                  {task.description}
                </p>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                      {new Date(task.deadline).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>

                {/* REMOVED Assigned To Section */}
              </div>

              {/* Action Buttons Area */}
              <div className="flex flex-row md:flex-col justify-end items-center md:items-end gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-border/50 md:pl-4">
                {(task.status === "In Progress" ||
                  task.status === "Completed") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full md:w-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewExplanationClick(
                        task,
                        getCardBgColor(task.status)
                      );
                    }}
                  >
                    <svg /* Eye Icon */
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 mr-1.5"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Details
                  </Button>
                )}
                {!isSelectMode && (
                  <Button
                    size="sm"
                    variant="ghost" // Use ghost for less emphasis until hover
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
                    <FileEdit className="mr-2 h-4 w-4" />
                    Update
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Dialogs --- */}
      {/* View Implementation/Details Dialog */}
      <Dialog
        open={!!selectedTaskDetails}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedTaskDetails?.status === "Completed"
                ? "Completed Task Details"
                : "Task Progress Details"}
            </DialogTitle>
            <DialogDescription>
              Review the implementation details submitted for this task.
            </DialogDescription>
          </DialogHeader>

          {selectedTaskDetails && (
            <div className="space-y-4 py-4">
              {/* Submitter Info */}
              <div className="space-y-1">
                <Label className="flex items-center text-sm font-medium text-muted-foreground">
                  <User className="w-4 h-4 mr-1.5" />
                  Submitted By (Team Lead/Rep)
                </Label>
                <p className="text-sm">
                  {selectedTaskDetails.submittedby &&
                  selectedTaskDetails.submittedby !== "Not-submitted"
                    ? (() => {
                        const submitter = submitters.find(
                          (s) => s.UserId === selectedTaskDetails.submittedby
                        );
                        return submitter
                          ? `${submitter.firstname} ${submitter.lastname} (${submitter.email})`
                          : `User ID: ${selectedTaskDetails.submittedby}`; // Fallback
                      })()
                    : "Not submitted yet"}
                </p>
              </div>

              <Separator />

              {/* GitHub URL */}
              <div className="space-y-1">
                <Label
                  htmlFor="github-url"
                  className="flex items-center text-sm font-medium text-muted-foreground"
                >
                  <Github className="w-4 h-4 mr-1.5" />
                  GitHub URL
                </Label>
                {selectedTaskDetails.gitHubUrl ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      id="github-url"
                      value={selectedTaskDetails.gitHubUrl}
                      readOnly
                      className="font-mono text-sm flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(selectedTaskDetails.gitHubUrl || "")
                      }
                      aria-label="Copy GitHub URL"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No GitHub URL provided.
                  </p>
                )}
              </div>

              {/* Context/Explanation */}
              <div className="space-y-1">
                <Label
                  htmlFor="context"
                  className="flex items-center text-sm font-medium text-muted-foreground"
                >
                  Implementation Notes / Context
                </Label>
                <Textarea
                  id="context"
                  value={
                    selectedTaskDetails.context || "No explanation provided."
                  }
                  readOnly
                  className="min-h-[100px] bg-muted/50 text-sm" // Slightly different bg
                />
              </div>

              {/* Feedback Area (Only shown when marking pending) */}
              {markpending && (
                <div className="space-y-1 pt-2 border-t">
                  <Label
                    htmlFor="feedback"
                    className="flex items-center text-sm font-medium text-destructive"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1.5" />
                    Feedback for Rejection (Required)
                  </Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setfeedback(e.target.value)}
                    placeholder="Provide clear reasons for marking this task as pending..."
                    className="min-h-[100px]"
                    required
                  />
                  {feedback.trim() === "" && (
                    <p className="text-xs text-red-600">Feedback is required</p>
                  )}
                </div>
              )}

              <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4">
                <Button variant="outline" onClick={handleCloseModal}>
                  Close
                </Button>

                {/* Conditional Actions based on Status and markpending state */}
                {selectedTaskDetails.status === "In Progress" &&
                  !markpending && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => setmarkpending(true)} // Show feedback area
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Mark Pending
                      </Button>
                      <Button variant="default" onClick={handleMarkCompleted}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark Completed
                      </Button>
                    </>
                  )}

                {selectedTaskDetails.status === "Completed" && !markpending && (
                  <Button
                    variant="destructive"
                    onClick={() => setmarkpending(true)} // Show feedback area
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Mark Pending
                  </Button>
                )}

                {markpending && (
                  <Button
                    variant="destructive"
                    onClick={handleMarkPending} // Trigger confirmation dialog
                    disabled={feedback.trim() === ""}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Confirm Rejection
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
              <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
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
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSelectedTasks} // Call the actual delete function
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Task(s)
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
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
              Confirm Mark as Pending
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
              value={feedback} // Should already have feedback from the main modal state
              onChange={(e) => setfeedback(e.target.value)} // Allow editing here too
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
              onClick={confirmMarkPending} // Call the actual mark pending function
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
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
              Confirm Task Update
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
              <FileEdit className="mr-2 h-4 w-4" />
              Continue to Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
