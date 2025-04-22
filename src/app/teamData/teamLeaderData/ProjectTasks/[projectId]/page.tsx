"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Copy,
  Check,
  X,
  Clock,
  PlusCircle,
  Trash2,
  AlertCircle,
  FileEdit,
  Users,
  Loader2,
  Info,
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Github,
  XCircle,
  CheckSquare,
  GithubIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
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
}

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

export default function ProjectTasksPage() {
  const { projectId } = useParams();
  const [markpending, setmarkpending] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ProjectTitle, setProjectTitle] = useState();
  const [feedback, setfeedback] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [taskColour, settaskColour] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [submitters, setSubmitters] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentUser, setCurrentUser] = useState<{ UserId: string } | null>(
    null
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [gitHubUrl, setGitHubUrl] = useState("");
  const [explanation, setExplanation] = useState("");
  const [reassignedTask, setReassignedTask] = useState<Task | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);

  const router = useRouter();
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(
    null
  );

  useEffect(() => {
    const fetchProjectTasks = async () => {
      try {
        const response = await fetch(
          `/api/teamData/teamLeaderData/getProjectTasks/${projectId}`,
          { method: "GET" }
        );
        const data = await response.json();
        if (data.success) {
          setTasks(data.tasks);
          setMembers(data.members);
          setProjectTitle(data.title);
          setSubmitters(data.submitters);
          setCurrentUser(data.currentUser || { UserId: "unknown" });
        } else {
          setError(data.message || "Failed to fetch tasks.");
          toast.error(data.message || "Failed to fetch tasks.");
        }
      } catch (err) {
        console.error("Error fetching project tasks:", err);
        setError("Failed to fetch project tasks. Please try again later.");
        toast.error("Failed to fetch project tasks. Please try again later.");
      }
      setLoading(false);
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

  const handleViewExplanationClick = (task: Task, colour: string) => {
    if (selectionMode) return;
    settaskColour(colour);
    setSelectedTaskDetails(task);
    setIsDialogOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedTaskDetails(null);
    setmarkpending(false);
    setIsDialogOpen(false);
    setReassignedTask(null);
  };

  const handleMarkPending = async () => {
    if (!selectedTaskDetails) return;
    const confirmSubmit = window.confirm(
      "Are you sure about marking this Task pending? This will result in deletion of the submission data of the task."
    );
    if (!confirmSubmit) return;
    if (feedback === "") {
      toast.error("Please enter feedback");
      return;
    }
    try {
      const response = await fetch(
        `/api/teamData/teamLeaderData/markTaskPending/${selectedTaskDetails.TaskId}`,
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
        handleCloseModal();
      } else {
        toast.error(data.message || "Failed to mark task as pending.");
        router.push("/teamData/ProfileTeam");
      }
    } catch (error) {
      console.error("Error marking task as pending:", error);
      toast.error("Failed to mark task as pending.");
      router.push("/teamData/ProfileTeam");
    }
  };

  const handleMarkCompleted = async () => {
    if (!selectedTaskDetails) return;
    const confirmSubmit = window.confirm(
      "Are you sure about marking this Task as Completed?"
    );
    if (!confirmSubmit) return;
    try {
      const response = await fetch(
        `/api/teamData/teamLeaderData/markTaskCompleted/${selectedTaskDetails.TaskId}`,
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
        handleCloseModal();
      } else {
        toast.error(data.message || "Failed to mark task as completed.");
      }
    } catch (error) {
      console.error("Error marking task as completed:", error);
      toast.error("Failed to mark task as completed.");
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    if (!selectionMode) return;

    setSelectedTaskIds((prevSelectedIds) =>
      prevSelectedIds.includes(taskId)
        ? prevSelectedIds.filter((id) => id !== taskId)
        : [...prevSelectedIds, taskId]
    );
  };

  const enableSelectionMode = () => {
    setSelectionMode(true);
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedTaskIds([]);
  };

  const handleUpdateTask = (taskId: string, status: string) => {
    if (selectionMode) return;
    if (!status) return;

    if (status === "Completed") {
      const confirmSubmit = window.confirm(
        "This Task has already been Completed. Updating it will override the current implementation. Are you sure you want to update it?"
      );
      if (!confirmSubmit) return;
    }

    if (status === "In Progress") {
      const confirmSubmit = window.confirm(
        "This Task has already been Performed by the user. Updating it will override the current implementation. Are you sure you want to update it?"
      );
      if (!confirmSubmit) return;
    }

    router.push(
      `/teamData/teamLeaderData/ProjectTasks/${projectId}/updateTask/${taskId}`
    );
  };

  const handleDeleteSelectedTasks = async () => {
    if (selectedTaskIds.length === 0) {
      toast.error("No tasks selected for deletion");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedTaskIds.length} selected task${selectedTaskIds.length > 1 ? "s" : ""}?`
    );

    if (confirmed) {
      try {
        const response = await fetch(
          "/api/teamData/teamLeaderData/deleteSelectedTasks",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskIds: selectedTaskIds }),
          }
        );
        const data = await response.json();
        if (data.success) {
          toast.success(
            `${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? "s" : ""} deleted successfully!`
          );
          setTasks((prevTasks) =>
            prevTasks.filter((task) => !selectedTaskIds.includes(task.TaskId))
          );
          setSelectedTaskIds([]);
          setSelectionMode(false);
        } else {
          toast.error(data.message || "Failed to delete tasks.");
        }
      } catch (error) {
        toast.error("Failed to delete tasks. Please try again.");
      }
    }
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "Pending":
        return {
          variant: "outline" as const,
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          className: "",
          borderStyle: "",
          bgStyle: "",
        };
      case "In Progress":
        return {
          variant: "outline" as const,
          icon: <RefreshCw className="h-3 w-3 mr-1" />,
          className:
            "bg-blue-100 text-blue-800 border-blue-500 hover:bg-blue-200",
          borderStyle: "border-l-4 border-blue-500",
          bgStyle: "bg-blue-50",
        };
      case "Completed":
        return {
          variant: "outline" as const,
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          className:
            "bg-green-100 text-green-800 border-green-500 hover:bg-green-200",
          borderStyle: "border-l-4 border-green-500",
          bgStyle: "bg-green-50",
        };
      case "Re Assigned":
        return {
          variant: "outline" as const,
          icon: <AlertTriangle className="h-3 w-3 mr-1" />,
          className:
            "bg-amber-100 text-amber-800 border-amber-500 hover:bg-amber-200",
          borderStyle: "border-l-4 border-amber-500",
          bgStyle: "bg-amber-50",
        };
      default:
        return {
          variant: "outline" as const,
          icon: <Info className="h-3 w-3 mr-1" />,
          className: "",
          borderStyle: "",
          bgStyle: "",
        };
    }
  };

  const getUserDetails = (userId: string) => {
    const member = members.find((m) => m.UserId === userId);
    return member
      ? {
          name: `${member.firstname} ${member.lastname}`,
          email: member.email,
          profilepic: member.profilepic,
        }
      : { name: "Unknown User", email: userId, profilepic: "" };
  };

  const getSubmitterDetails = (submittedById?: string) => {
    if (!submittedById) return null;
    const submitter = submitters.find((s) => s.UserId === submittedById);
    return submitter
      ? {
          name: `${submitter.firstname} ${submitter.lastname}`,
          email: submitter.email,
          profilepic: submitter.profilepic,
        }
      : { name: "Unknown User", email: submittedById, profilepic: "" };
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      searchQuery === "" ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      task.status.toLowerCase() === statusFilter.toLowerCase();

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

  const handleCreateTask = () => {
    if (selectionMode) return;
    router.push(`/teamData/teamLeaderData/CreateSpecifiedTask/${projectId}`);
  };

  const handleMarkPendingstate = () => {
    setmarkpending(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <span className="ml-2">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <div className="bg-destructive/20 p-4 sm:p-6 rounded-lg max-w-md mx-auto">
          <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-destructive mx-auto mb-3 sm:mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-destructive mb-2">
            Error
          </h2>
          <p className="text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/teamData/ProfileTeam")}
          >
            Return to Team Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{ProjectTitle}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage and track your project tasks
        </p>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
        {!selectionMode ? (
          <>
            <Button
              onClick={handleCreateTask}
              className="flex items-center gap-1 sm:gap-2 text-sm"
              size="sm"
            >
              <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Create Task
            </Button>

            <Button
              variant="outline"
              onClick={enableSelectionMode}
              className="flex items-center gap-1 sm:gap-2 text-sm"
              size="sm"
            >
              <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Select Tasks
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={cancelSelection}
              className="flex items-center gap-1 sm:gap-2 text-sm"
              size="sm"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Cancel Selection
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteSelectedTasks}
              className="flex items-center gap-1 sm:gap-2 text-sm"
              size="sm"
              disabled={selectedTaskIds.length === 0}
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Delete Selected (
              {selectedTaskIds.length})
            </Button>
          </>
        )}
      </div>

      <div className="bg-card shadow-sm rounded-lg p-3 sm:p-4 mb-6 sm:mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm sm:text-base h-9 sm:h-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="re assigned">Re-Assigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center p-6 sm:p-12 bg-muted/20 rounded-lg">
          <Info className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg sm:text-xl font-medium mb-2">
            No tasks found
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sortedTasks.map((task) => {
            const statusDetails = getStatusDetails(task.status);
            const isAssignedToCurrentUser =
              currentUser && task.assignedTo.includes(currentUser.UserId);
            const deadlineDate = new Date(task.deadline);
            const isPastDeadline = deadlineDate < new Date();
            const isSelected = selectedTaskIds.includes(task.TaskId);

            return (
              <Card
                key={task.TaskId}
                className={`transition-all duration-300 ${statusDetails.borderStyle} ${statusDetails.bgStyle} ${
                  isSelected
                    ? "ring-2 ring-primary border-primary bg-primary/5"
                    : ""
                } group relative hover:shadow-lg hover:-translate-y-1 cursor-pointer`}
                onClick={() =>
                  selectionMode ? toggleTaskSelection(task.TaskId) : null
                }
              >
                {selectionMode && (
                  <div className="absolute top-2 right-2 z-10">
                    <div
                      className={`h-5 w-5 rounded-sm border ${
                        isSelected
                          ? "bg-primary border-primary text-white"
                          : "border-gray-300 bg-white"
                      } flex items-center justify-center`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                )}

                <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base sm:text-xl">
                      {task.title}
                    </CardTitle>
                    <Badge
                      variant={statusDetails.variant}
                      className={cn(
                        "flex items-center text-xs sm:text-sm",
                        statusDetails.className
                      )}
                    >
                      {statusDetails.icon}
                      {task.status}
                    </Badge>
                  </div>
                  <CardDescription className="mt-2 line-clamp-2 text-xs sm:text-sm">
                    {task.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-4 pb-2 px-3 sm:px-6">
                  <div className="flex items-start space-x-2">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium">Deadline</p>
                      <p
                        className={`text-xs sm:text-sm ${isPastDeadline ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {deadlineDate.toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 flex items-center">
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Assigned to:
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {task.assignedTo.map((userId) => {
                        const user = getUserDetails(userId);
                        const isCurrentUser =
                          currentUser && userId === currentUser.UserId;

                        return (
                          <TooltipProvider key={userId}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex items-center gap-1 sm:gap-2 rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs ${
                                    isCurrentUser
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Avatar className="h-4 w-4 sm:h-5 sm:w-5">
                                    <AvatarImage
                                      src={user.profilepic}
                                      alt={user.name}
                                    />
                                    <AvatarFallback className="text-[10px] sm:text-xs">
                                      {user.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate max-w-[80px] sm:max-w-[100px] text-[10px] sm:text-xs">
                                    {user.name}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs sm:text-sm">
                                  {user.email}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 flex justify-between items-center px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="flex-1">
                    {task.status === "In Progress" && !selectionMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 text-xs sm:text-sm h-8 px-2 sm:px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewExplanationClick(task, "bg-blue-50");
                        }}
                      >
                        <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">View</span>{" "}
                        Implementation
                      </Button>
                    )}

                    {task.status === "Completed" && !selectionMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 text-xs sm:text-sm h-8 px-2 sm:px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewExplanationClick(task, "bg-green-50");
                        }}
                      >
                        <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">View</span>{" "}
                        Implementation
                      </Button>
                    )}

                    {task.status === "Re Assigned" && !selectionMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 text-xs sm:text-sm h-8 px-2 sm:px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReassignedTask(task);
                        }}
                      >
                        <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">View</span> Feedback
                      </Button>
                    )}
                  </div>

                  {!selectionMode && (
                    <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-black bg-transparent hover:bg-gray-100 sm:hover:bg-transparent sm:hover:text-fuchsia-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateTask(task.TaskId, task.status);
                              }}
                            >
                              <FileEdit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs sm:text-sm">
                              Update this task
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={isDialogOpen && !!selectedTaskDetails}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
          else setIsDialogOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-w-[95vw] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedTaskDetails?.status === "Completed"
                ? "Completed Task"
                : "Task Implementation"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Review the implementation details for this task.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1">
            <Label className="flex items-center text-xs sm:text-sm font-medium">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
              Submitted By
            </Label>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {(() => {
                const submitter = selectedTaskDetails?.submittedby
                  ? getSubmitterDetails(selectedTaskDetails.submittedby)
                  : null;
                return submitter
                  ? `${submitter.name} (${submitter.email})`
                  : "Not submitted yet";
              })()}
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <Label className="flex items-center text-xs sm:text-sm font-medium">
              <GithubIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
              GitHub URL
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                value={selectedTaskDetails?.gitHubUrl || ""}
                readOnly
                className="font-mono text-xs sm:text-sm h-8 sm:h-10"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  copyToClipboard(selectedTaskDetails?.gitHubUrl || "")
                }
                className="h-8 sm:h-10 w-8 sm:w-10 p-0"
              >
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          {markpending ? (
            <div className="space-y-1">
              <Label className="flex items-center text-xs sm:text-sm font-medium">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-amber-500" />
                Feedback for Rejection
              </Label>
              <Textarea
                value={feedback}
                onChange={(e) => setfeedback(e.target.value)}
                placeholder="Please provide feedback on why this task is being marked as pending..."
                className="min-h-[100px] sm:min-h-[120px] text-xs sm:text-sm"
              />
              {feedback.trim() === "" && (
                <p className="text-[10px] sm:text-xs text-red-500">
                  Feedback is required
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="flex items-center text-xs sm:text-sm font-medium">
                Implementation Details
              </Label>
              <Textarea
                value={
                  selectedTaskDetails?.context || "No explanation provided"
                }
                readOnly
                className="min-h-[100px] sm:min-h-[120px] text-xs sm:text-sm"
              />
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedTaskDetails?.status === "In Progress" && (
              <>
                {markpending ? (
                  <Button
                    variant="destructive"
                    onClick={handleMarkPending}
                    disabled={feedback.trim() === ""}
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Confirm Rejection
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      onClick={handleMarkPendingstate}
                      className="text-xs sm:text-sm h-8 sm:h-10"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Mark as Pending
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleMarkCompleted}
                      className="text-xs sm:text-sm h-8 sm:h-10"
                    >
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Mark as Completed
                    </Button>
                  </>
                )}
              </>
            )}

            {selectedTaskDetails?.status === "Completed" && (
              <>
                {markpending ? (
                  <Button
                    variant="destructive"
                    onClick={handleMarkPending}
                    disabled={feedback.trim() === ""}
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Confirm Rejection
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleMarkPendingstate}
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Mark as Pending
                  </Button>
                )}
              </>
            )}

            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="text-xs sm:text-sm h-8 sm:h-10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reassignedTask !== null}
        onOpenChange={(open) => !open && setReassignedTask(null)}
      >
        <DialogContent className="sm:max-w-[600px] max-w-[95vw] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Feedback on {reassignedTask?.title}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              This task has been reassigned with the following feedback.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1">
            <Label className="flex items-center text-xs sm:text-sm font-medium">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-amber-500" />
              Feedback
            </Label>
            <div className="border border-amber-200 rounded-md p-3 sm:p-4 bg-amber-50">
              <Textarea
                value={reassignedTask?.context || "No feedback provided"}
                readOnly
                rows={6}
                className="bg-transparent border-0 focus-visible:ring-0 resize-none min-h-[100px] sm:min-h-[120px] text-xs sm:text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="default"
              onClick={() => {
                setReassignedTask(null);
                if (reassignedTask)
                  handleUpdateTask(
                    reassignedTask.TaskId,
                    reassignedTask.status
                  );
              }}
              className="text-xs sm:text-sm h-8 sm:h-10"
            >
              Update Task
            </Button>
            <Button
              variant="outline"
              onClick={() => setReassignedTask(null)}
              className="text-xs sm:text-sm h-8 sm:h-10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
