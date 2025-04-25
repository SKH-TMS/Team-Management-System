"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// Assuming TaskCard and TaskDetailsModal are updated to not require 'members' prop for TaskCard
import { TaskCard } from "../components/task-card"; // Needs update internally
import { TaskDetailsModal } from "../components/task-details-modal";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  CheckSquare,
  Square,
  AlertCircle,
  Briefcase,
  LayoutGrid,
  LayoutList,
  Search,
  Filter,
  X,
  Loader2, // Added Loader2
} from "lucide-react";

// Assuming Task type is updated (no assignedTo)
// Assuming Member type is still needed for Submitters
import type { Task, Member } from "../types"; // Adjust path as needed

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params.projectId as string; // Type assertion
  const router = useRouter();

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectTitle, setProjectTitle] = useState<string>("");
  // const [members, setMembers] = useState<Member[]>([]); // Removed members state
  const [submitters, setSubmitters] = useState<Member[]>([]); // Keep submitters for modal
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false); // Specific loading state for delete
  const [error, setError] = useState("");
  // Removed feedback state as it's handled within the modal now

  // UI State
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch Project Tasks
  useEffect(() => {
    if (!projectId) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }

    const fetchProjectTasks = async () => {
      setLoading(true);
      setError("");
      try {
        // API endpoint needs update to not return members
        const response = await fetch(
          `/api/projectManagerData/taskManagementData/getProjectTasks/${projectId}`,
          { method: "GET" } // Assuming GET is appropriate
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch project tasks");
        }
        setTasks(data.tasks || []);
        // setMembers(data.members); // Removed members setting
        setProjectTitle(data.title || "Project Tasks"); // Use fetched title or default
        setSubmitters(data.submitters || []); // Set submitters
      } catch (err: any) {
        console.error("Error fetching project tasks:", err);
        const message = err.message || "Failed to fetch project tasks.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectTasks();
  }, [projectId]);

  // --- Event Handlers ---

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("GitHub URL copied to clipboard!");
    });
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleToggleSelectMode = () => {
    if (isSelectMode) {
      setSelectedTaskIds([]); // Clear selection when exiting mode
    }
    setIsSelectMode(!isSelectMode);
  };

  const handleViewImplementation = (task: Task) => {
    setSelectedTaskDetails(task);
  };

  const handleCloseTaskDetails = () => {
    setSelectedTaskDetails(null);
  };

  // Mark Completed (logic remains same, relies on modal state)
  const handleMarkCompleted = async () => {
    if (!selectedTaskDetails) return;
    // Add loading state?
    try {
      const response = await fetch(
        `/api/projectManagerData/taskManagementData/markTaskCompleted/${selectedTaskDetails.TaskId}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);
      toast.success("Task marked as completed!");
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.TaskId === selectedTaskDetails.TaskId
            ? { ...task, status: "Completed" }
            : task
        )
      );
      handleCloseTaskDetails(); // Close modal on success
    } catch (error: any) {
      console.error("Error marking task as completed:", error);
      toast.error(error.message || "Failed to mark task as completed.");
    }
  };

  // Mark Pending (logic remains same, relies on modal state & feedback)
  const handleMarkPending = async (feedback: string) => {
    if (!selectedTaskDetails || !feedback) return;
    // Add loading state?
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
      if (!response.ok || !data.success) throw new Error(data.message);
      toast.success("Task marked as pending!");
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.TaskId === selectedTaskDetails.TaskId
            ? { ...task, status: "Re Assigned", context: feedback } // Update status and context locally
            : task
        )
      );
      handleCloseTaskDetails(); // Close modal on success
    } catch (error: any) {
      console.error("Error marking task as pending:", error);
      toast.error(error.message || "Failed to mark task as pending.");
    }
  };

  // Navigate to Update Task Page
  const handleUpdateTask = (taskId: string /*, status: string */) => {
    // Removed status check and confirmation here, handled on the ManageTasks page if needed
    // Navigate to the main update page, passing projectId and taskId
    router.push(
      `/projectManagerData/taskManagementData/ManageTasks/updateTask/${projectId}/${taskId}`
    );
  };

  // Navigate to Create Task Page (scoped to this project)
  const handleCreateTask = () => {
    router.push(
      `/projectManagerData/taskManagementData/CreateSpecifiedTask/${projectId}` // Use the refactored page
    );
  };

  // Delete Selected Tasks
  const handleDeleteSelectedTasks = async () => {
    if (selectedTaskIds.length === 0) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        "/api/projectManagerData/taskManagementData/deleteSelectedTasks", // Use the existing endpoint
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
      setIsSelectMode(false); // Exit select mode
    } catch (error: any) {
      console.error("Error deleting tasks:", error);
      toast.error(error.message || "Failed to delete tasks.");
    } finally {
      setShowDeleteConfirm(false); // Close confirmation dialog
      setIsDeleting(false);
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
      // Add more fields to search? e.g., TaskId?

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const statusOrder: { [key: string]: number } = {
        "Re Assigned": 1,
        Pending: 2,
        "In Progress": 3,
        Completed: 4,
      };
      // Add default value for robustness
      return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    });

  // --- Render Logic ---

  if (loading) {
    // Simplified Skeleton Loader
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
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
          <Briefcase className="h-6 w-6 flex-shrink-0" />
          <span>{projectTitle || `Project ${projectId}`}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Displaying {filteredAndSortedTasks.length} of {tasks.length} task
          {tasks.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Actions & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        {/* Left Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCreateTask} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
          <Button
            variant={isSelectMode ? "secondary" : "outline"}
            size="sm"
            onClick={handleToggleSelectMode}
          >
            {isSelectMode ? (
              <X className="mr-2 h-4 w-4" />
            ) : (
              <Square className="mr-2 h-4 w-4" />
            )}
            {isSelectMode ? "Cancel" : "Select"}
          </Button>
          {isSelectMode && selectedTaskIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedTaskIds.length})
            </Button>
          )}
        </div>

        {/* Right Filters/View */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full md:w-48 lg:w-64 h-9" // Adjusted size
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-auto md:w-[160px] h-9 text-xs sm:text-sm">
              {" "}
              {/* Adjusted size */}
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Re Assigned">Re-Assigned</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="h-9 w-9" // Adjusted size
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
          <h3 className="text-xl font-medium mb-2">No Tasks Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create the first task for this project.
          </p>
          <Button onClick={handleCreateTask}>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>
      ) : filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card mt-6">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Matching Tasks</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search or filter criteria.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      ) : (
        <div
          className={`grid gap-4 sm:gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
        >
          {filteredAndSortedTasks.map((task) => (
            <TaskCard
              key={task.TaskId}
              task={task}
              // members={members} // REMOVED members prop
              isSelected={selectedTaskIds.includes(task.TaskId)}
              isSelectMode={isSelectMode}
              onSelect={toggleTaskSelection}
              onViewImplementation={handleViewImplementation}
              onUpdateTask={() =>
                handleUpdateTask(task.TaskId /*, task.status */)
              } // Pass only taskId
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <TaskDetailsModal
        task={selectedTaskDetails}
        submitters={submitters} // Pass submitters data
        isOpen={!!selectedTaskDetails}
        onClose={handleCloseTaskDetails}
        onMarkCompleted={handleMarkCompleted}
        onMarkPending={handleMarkPending} // Pass feedback handler
        onCopyToClipboard={copyToClipboard}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTaskIds.length} selected
              task{selectedTaskIds.length === 1 ? "" : "s"}? This action cannot
              be undone and will remove associated subtasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteSelectedTasks}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
