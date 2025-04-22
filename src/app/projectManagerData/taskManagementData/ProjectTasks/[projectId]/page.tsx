"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { TaskCard } from "../components/task-card";
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
} from "lucide-react";

import type { Task, Member } from "../types";

export default function ProjectTasksPage() {
  const { projectId } = useParams();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [submitters, setSubmitters] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchProjectTasks = async () => {
      try {
        const response = await fetch(
          `/api/projectManagerData/taskManagementData/getProjectTasks/${projectId}`,
          {
            method: "GET",
          }
        );
        const data = await response.json();
        if (data.success) {
          setTasks(data.tasks);
          setMembers(data.members);
          setProjectTitle(data.title);
          setSubmitters(data.submitters);
        } else {
          setError(data.message || "Failed to fetch tasks.");
          toast.error(data.message || "Failed to fetch tasks.");
        }
      } catch (err) {
        console.error("Error fetching project tasks:", err);
        setError("Failed to fetch project tasks. Please try again later.");
        toast.error("Failed to fetch project tasks. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectTasks();
    }
  }, [projectId]);

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
      setSelectedTaskIds([]);
    }
    setIsSelectMode(!isSelectMode);
  };

  const handleViewImplementation = (task: Task) => {
    setSelectedTaskDetails(task);
  };

  const handleCloseTaskDetails = () => {
    setSelectedTaskDetails(null);
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
        setSelectedTaskDetails(null);
      } else {
        toast.error(data.message || "Failed to mark task as completed.");
      }
    } catch (error) {
      console.error("Error marking task as completed:", error);
      toast.error("Failed to mark task as completed.");
    }
  };

  const handleMarkPending = async (feedback: string) => {
    if (!selectedTaskDetails) return;

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
              ? { ...task, status: "Pending" }
              : task
          )
        );
        setSelectedTaskDetails(null);
      } else {
        toast.error(data.message || "Failed to mark task as pending.");
      }
    } catch (error) {
      console.error("Error marking task as pending:", error);
      toast.error("Failed to mark task as pending.");
    }
  };

  const handleUpdateTask = (taskId: string, status: string) => {
    if (status === "Completed" || status === "In Progress") {
      const confirmMessage =
        status === "Completed"
          ? "This Task has already been Completed. Updating it will override the current implementation."
          : "This Task has already been Performed by the user. Updating it will override the current implementation.";

      if (
        !window.confirm(`${confirmMessage} Are you sure you want to update it?`)
      ) {
        return;
      }
    }

    router.push(
      `/projectManagerData/taskManagementData/ProjectTasks/${projectId}/updateTask/${taskId}`
    );
  };

  const handleCreateTask = () => {
    router.push(
      `/projectManagerData/taskManagementData/CreateSpecifiedTask/${projectId}`
    );
  };

  const handleDeleteSelectedTasks = async () => {
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
        setShowDeleteConfirm(false);
      } else {
        toast.error(data.message || "Failed to delete tasks.");
      }
    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast.error("Failed to delete tasks. Please try again.");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const filteredAndSortedTasks = tasks
    .filter((task) => {
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());

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
      return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-10 w-64 mx-auto mb-6" />
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="border rounded-lg p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
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
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Briefcase className="mr-2 h-6 w-6" />
          {projectTitle}
        </h1>
        <p className="text-muted-foreground">
          {filteredAndSortedTasks.length} of {tasks.length}{" "}
          {tasks.length === 1 ? "task" : "tasks"} displayed
        </p>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex flex-wrap gap-2 mb-2 sm:mb-0">
          <Button onClick={handleCreateTask} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>

          <Button
            variant={isSelectMode ? "destructive" : "outline"}
            onClick={handleToggleSelectMode}
            className="gap-1.5"
          >
            {isSelectMode ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {isSelectMode ? "Cancel Selection" : "Select Tasks"}
          </Button>

          {selectedTaskIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedTaskIds.length})
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <LayoutList className="h-4 w-4" />
            ) : (
              <LayoutGrid className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </div>
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
            <Button variant="ghost" onClick={clearFilters} className="gap-1.5">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Tasks Found</h3>
          <p className="text-muted-foreground mb-6">
            There are no tasks assigned for this project yet.
          </p>
          <Button onClick={handleCreateTask}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Task
          </Button>
        </div>
      ) : filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Matching Tasks</h3>
          <p className="text-muted-foreground mb-6">
            No tasks match your current search or filter criteria.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      ) : (
        <div
          className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
        >
          {filteredAndSortedTasks.map((task) => (
            <TaskCard
              key={task.TaskId}
              task={task}
              members={members}
              isSelected={selectedTaskIds.includes(task.TaskId)}
              isSelectMode={isSelectMode}
              onSelect={toggleTaskSelection}
              onViewImplementation={handleViewImplementation}
              onUpdateTask={handleUpdateTask}
            />
          ))}
        </div>
      )}

      <TaskDetailsModal
        task={selectedTaskDetails}
        submitters={submitters}
        isOpen={!!selectedTaskDetails}
        onClose={handleCloseTaskDetails}
        onMarkCompleted={handleMarkCompleted}
        onMarkPending={handleMarkPending}
        onCopyToClipboard={copyToClipboard}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTaskIds.length} selected{" "}
              {selectedTaskIds.length === 1 ? "task" : "tasks"}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelectedTasks}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
