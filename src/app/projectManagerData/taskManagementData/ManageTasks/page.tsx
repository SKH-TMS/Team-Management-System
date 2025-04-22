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
  User,
  Users,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

interface Task {
  TaskId: string;
  title: string;
  description: string;
  assignedTo: string[];
  deadline: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  gitHubUrl?: string;
  context?: string;
  submittedby?: string;
  // Flattened assignment details:
  projectId: string;
  projectName: string;
  teamId: string;
  teamName: string;
}

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

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
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitters, setSubmitters] = useState<Member[]>([]);
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
    try {
      const response = await fetch(
        "/api/projectManagerData/taskManagementData/getTasks",
        { method: "GET" }
      );
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
        setMembers(data.members);
        setSubmitters(data.submitters);
      } else {
        setError(data.message || "Failed to fetch tasks.");
        toast.error(data.message || "Failed to fetch tasks.");
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to fetch tasks. Please try again later.");
      toast.error("Failed to fetch tasks. Please try again later.");
    }
    setLoading(false);
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

  const handleMarkPending = async () => {
    if (!selectedTaskDetails) return;

    if (feedback === "") {
      toast.error("Please enter feedback");
      return;
    }

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
        setmarkpending(false);
        setfeedback("");
        setShowMarkPendingConfirm(false);
      } else {
        toast.error(data.message || "Failed to mark task as pending.");
        router.push("/projectManagerData/ProfileProjectManager");
      }
    } catch (error) {
      console.error("Error marking task as pending:", error);
      toast.error("Failed to mark task as pending.");
      router.push("/projectManagerData/ProfileProjectManager");
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
        setSelectedTaskDetails(null);
      } else {
        toast.error(data.message || "Failed to mark task as completed.");
      }
    } catch (error) {
      console.error("Error marking task as completed:", error);
      toast.error("Failed to mark task as completed.");
    }
  };

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
        return <Loader2 className="h-4 w-4" />;
      case "Completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "Re Assigned":
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleUpdateTask = (
    taskId: string,
    status: string,
    projectId: string
  ) => {
    if (status === "Completed" || status === "In Progress") {
      setUpdateConfirmDialog({
        isOpen: true,
        taskId,
        projectId,
        status,
      });
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
      toast.error("Failed to delete tasks. Please try again.");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      searchQuery === "" ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.teamName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedTasks = filteredTasks.sort((a, b) => {
    const statusOrder: { [key: string]: number } = {
      "Re Assigned": 1,
      Pending: 2,
      "In Progress": 3,
      Completed: 4,
    };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const handleMarkPendingstate = () => {
    setShowMarkPendingConfirm(true);
  };

  const handleTaskClick = (taskId: string) => {
    if (isSelectMode) {
      toggleTaskSelection(taskId);
    }
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
      setSelectedTaskIds([]);
      setIsSelectMode(false);
    } else {
      setIsSelectMode(true);
    }
  };

  const handleCreateTask = () => {
    router.push("/projectManagerData/taskManagementData/CreateTask");
  };

  const getInitials = (firstname: string, lastname: string) => {
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
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

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Manage All Tasks</h1>
        <div className="flex items-center gap-2">
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
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8 w-[200px] md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button onClick={handleCreateTask}>
          <PlusCircle className="h-4 w-4" />
          Create Task
        </Button>
        <Button
          variant={isSelectMode ? "destructive" : "default"}
          onClick={handleToggleSelectMode}
        >
          {isSelectMode ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancel Selection
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              Select Tasks
            </>
          )}
        </Button>

        {selectedTaskIds.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected ({selectedTaskIds.length})
          </Button>
        )}

        <div className="ml-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
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

      <div className="mb-4 text-sm text-muted-foreground">
        Showing {sortedTasks.length} of {tasks.length} tasks
        {(searchQuery || statusFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {sortedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-muted-foreground mt-2">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first task to get started"}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTasks.map((task) => (
            <Card
              key={task.TaskId}
              className={`overflow-hidden transition-all duration-300 hover:shadow-lg group relative hover:-translate-y-1 ${getCardBgColor(task.status)} ${
                selectedTaskIds.includes(task.TaskId)
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => handleTaskClick(task.TaskId)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl line-clamp-1">
                    {task.title}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 ${getStatusColor(task.status)}`}
                  >
                    {getStatusIcon(task.status)}
                    {task.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {task.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Project</p>
                      <p className="text-muted-foreground">
                        {task.projectName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Team</p>
                      <p className="text-muted-foreground">{task.teamName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Deadline</p>
                      <p className="text-muted-foreground">
                        {new Date(task.deadline).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="my-3" />

                <div>
                  <p className="font-medium text-sm mb-2">Assigned To:</p>
                  <div className="flex flex-wrap gap-2">
                    {task.assignedTo.map((userId) => {
                      const member = members.find((m) => m.UserId === userId);
                      return member ? (
                        <TooltipProvider key={userId}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Avatar className="h-8 w-8">
                                {member.profilepic ? (
                                  <AvatarImage
                                    src={
                                      member.profilepic || "/placeholder.svg"
                                    }
                                    alt={`${member.firstname} ${member.lastname}`}
                                  />
                                ) : null}
                                <AvatarFallback>
                                  {getInitials(
                                    member.firstname,
                                    member.lastname
                                  )}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {member.firstname} {member.lastname}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.email}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Avatar key={userId} className="h-8 w-8">
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                {(task.status === "In Progress" ||
                  task.status === "Completed") && (
                  <div className="w-full">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewExplanationClick(
                          task,
                          task.status === "In Progress"
                            ? "bg-blue-50"
                            : "bg-green-50"
                        );
                      }}
                    >
                      <svg
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
                      View Implementation
                    </Button>

                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity ">
                      <Button
                        size="sm"
                        className="hover:text-slate-700 bg-transparent text-black hover:bg-transparent hover:border hover:border-indigo-100"
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
                    </div>
                  </div>
                )}

                {(task.status === "Pending" ||
                  task.status === "Re Assigned") && (
                  <div className="w-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      className="hover:text-slate-700 bg-transparent text-black hover:bg-transparent hover:border hover:border-indigo-100"
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
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map((task) => (
            <div
              key={task.TaskId}
              className={`flex flex-col md:flex-row gap-4 p-4 rounded-lg border group hover:shadow-md transition-all ${getCardBgColor(task.status)} ${
                selectedTaskIds.includes(task.TaskId)
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => handleTaskClick(task.TaskId)}
            >
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">{task.title}</h3>
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 ${getStatusColor(task.status)}`}
                  >
                    {getStatusIcon(task.status)}
                    {task.status}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  {task.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Project</p>
                      <p className="text-muted-foreground">
                        {task.projectName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Team</p>
                      <p className="text-muted-foreground">{task.teamName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Deadline</p>
                      <p className="text-muted-foreground">
                        {new Date(task.deadline).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="font-medium text-sm mb-2">Assigned To:</p>
                  <div className="flex flex-wrap gap-2">
                    {task.assignedTo.map((userId) => {
                      const member = members.find((m) => m.UserId === userId);
                      return member ? (
                        <TooltipProvider key={userId}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Avatar className="h-8 w-8">
                                {member.profilepic ? (
                                  <AvatarImage
                                    src={
                                      member.profilepic || "/placeholder.svg"
                                    }
                                    alt={`${member.firstname} ${member.lastname}`}
                                  />
                                ) : null}
                                <AvatarFallback>
                                  {getInitials(
                                    member.firstname,
                                    member.lastname
                                  )}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {member.firstname} {member.lastname}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.email}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Avatar key={userId} className="h-8 w-8">
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col justify-end items-end gap-2 mt-4 md:mt-0">
                {(task.status === "In Progress" ||
                  task.status === "Completed") && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewExplanationClick(
                          task,
                          task.status === "In Progress"
                            ? "bg-blue-50"
                            : "bg-green-50"
                        );
                      }}
                    >
                      <svg
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
                      View Implementation
                    </Button>
                  </>
                )}

                <Button
                  size="sm"
                  className="hover:text-slate-700 bg-transparent text-black hover:bg-transparent hover:border hover:border-indigo-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateTask(task.TaskId, task.status, task.projectId);
                  }}
                >
                  <FileEdit className="mr-2 h-4 w-4" />
                  Update
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!selectedTaskDetails}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedTaskDetails?.status === "Completed"
                ? "Completed Task"
                : "Task Implementation"}
            </DialogTitle>
            <DialogDescription>
              Review the implementation details for this task.
            </DialogDescription>
          </DialogHeader>

          {selectedTaskDetails && (
            <>
              {/* Submitter Info */}
              <div className="space-y-1">
                <Label className="flex items-center text-sm font-medium">
                  <User className="w-4 h-4 mr-1.5" />
                  Submitted By
                </Label>
                <div className="text-sm text-muted-foreground">
                  {selectedTaskDetails.submittedby
                    ? (() => {
                        const submitter = submitters.find(
                          (s) => s.UserId === selectedTaskDetails.submittedby
                        );
                        return submitter
                          ? `${submitter.firstname} ${submitter.lastname} (${submitter.email})`
                          : selectedTaskDetails.submittedby;
                      })()
                    : "Not submitted yet"}
                </div>
              </div>

              <Separator />

              {/* GitHub URL */}
              <div className="space-y-1">
                <Label className="flex items-center text-sm font-medium">
                  <Github className="w-4 h-4 mr-1.5" />
                  GitHub URL
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={selectedTaskDetails.gitHubUrl || ""}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(selectedTaskDetails.gitHubUrl || "")
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {markpending ? (
                <div className="space-y-1">
                  <Label className="flex items-center text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-500" />
                    Feedback for Rejection
                  </Label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setfeedback(e.target.value)}
                    placeholder="Please provide feedback on why this task is being marked as pending..."
                    className="min-h-[120px]"
                  />
                  {feedback.trim() === "" && (
                    <p className="text-xs text-red-500">Feedback is required</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="flex items-center text-sm font-medium">
                    Implementation Details
                  </Label>
                  <Textarea
                    value={
                      selectedTaskDetails.context || "No explanation provided"
                    }
                    readOnly
                    className="min-h-[120px]"
                  />
                </div>
              )}

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedTaskDetails.status === "In Progress" && (
                  <>
                    {markpending ? (
                      <Button
                        variant="destructive"
                        onClick={handleMarkPending}
                        disabled={feedback.trim() === ""}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Confirm Rejection
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="destructive"
                          onClick={handleMarkPendingstate}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Mark as Pending
                        </Button>
                        <Button variant="default" onClick={handleMarkCompleted}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark as Completed
                        </Button>
                      </>
                    )}
                  </>
                )}

                {selectedTaskDetails.status === "Completed" && (
                  <>
                    {markpending ? (
                      <Button
                        variant="destructive"
                        onClick={handleMarkPending}
                        disabled={feedback.trim() === ""}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Confirm Rejection
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        onClick={handleMarkPendingstate}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Mark as Pending
                      </Button>
                    )}
                  </>
                )}

                <Button variant="outline" onClick={handleCloseModal}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTaskIds.length} selected
              task(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelectedTasks}>
              Delete Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              This will mark the task as pending and notify the team member.
              This action will result in deletion of the submission data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label className="flex items-center text-sm font-medium">
              Feedback (Required)
            </Label>
            <Textarea
              value={feedback}
              onChange={(e) => setfeedback(e.target.value)}
              placeholder="Please provide feedback on why this task is being marked as pending..."
              className="min-h-[120px]"
            />
            {feedback.trim() === "" && (
              <p className="text-xs text-red-500">Feedback is required</p>
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
              onClick={handleMarkPending}
              disabled={feedback.trim() === ""}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {updateConfirmDialog.status === "Completed"
                ? "This task has already been completed. Updating it will override the current implementation."
                : "This task has already been performed by the user. Updating it will override the current implementation."}
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
