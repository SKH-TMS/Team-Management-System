"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search,
  Github,
  XCircle,
  Copy,
  Info,
  Clock,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  PenTool,
} from "lucide-react";

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

interface Task {
  TaskId: string;
  title: string;
  description: string;
  assignedTo: string[];
  deadline: string;
  status: string;
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

interface CurrentUser {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
}

export default function ProjectTasksPage() {
  const { projectId } = useParams();
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [submitters, setSubmitters] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(
    null
  );
  const [reassignedTask, setReassignedTask] = useState<Task | null>(null);

  const [gitHubUrl, setGitHubUrl] = useState("");
  const [explanation, setExplanation] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAssignedOnly, setShowAssignedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  async function fetchProjectTasks() {
    try {
      const res = await fetch(
        `/api/teamData/teamMemberData/getProjectTasks/${projectId}`
      );
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
        setMembers(data.members);
        setSubmitters(data.submitters);
        setCurrentUser(data.currentUser);
        setProjectName(data.title);
      } else {
        throw new Error(data.message || "Failed to fetch");
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      router.push("/teamData/ProfileTeam");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) fetchProjectTasks();
  }, [projectId]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied!");
    });
  }

  function handleCardClick(task: Task) {
    if (task.status === "Completed") return;
    if (task.status === "In Progress") {
      if (
        !window.confirm(
          "This task is In Progress. Override the current implementation?"
        )
      )
        return;
    }
    setSelectedTask(task);
    setGitHubUrl(task.gitHubUrl || "");
    setExplanation(task.context || "");
  }

  async function handleSubmitTask() {
    if (!selectedTask) return;
    if (
      selectedTask.status === "In Progress" &&
      !window.confirm("Updating will override. Proceed?")
    )
      return;

    try {
      const res = await fetch("/api/teamData/teamMemberData/submitTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TaskId: selectedTask.TaskId,
          gitHubUrl,
          context: explanation,
          submittedby: currentUser?.UserId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Task updated!");
        setSelectedTask(null);
        fetchProjectTasks();
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  }

  function getStatusDetails(status: string) {
    switch (status) {
      case "Pending":
        return {
          variant: "secondary" as const,
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          className: "",
        };
      case "In Progress":
        return {
          variant: "outline" as const,
          icon: <RefreshCw className="h-3 w-3 mr-1" />,
          className:
            "bg-blue-100 text-blue-800 border-blue-500 hover:bg-blue-200",
        };
      case "Completed":
        return {
          variant: "outline" as const,
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          className:
            "bg-green-100 text-green-800 border-green-500 hover:bg-green-200",
        };
      case "Re Assigned":
        return {
          variant: "outline" as const,
          icon: <AlertTriangle className="h-3 w-3 mr-1" />,
          className:
            "bg-amber-100 text-amber-800 border-amber-500 hover:bg-amber-200",
        };
      default:
        return {
          variant: "outline" as const,
          icon: <Info className="h-3 w-3 mr-1" />,
          className: "",
        };
    }
  }

  function getUserDetails(userId: string) {
    const m = members.find((m) => m.UserId === userId);
    return m
      ? {
          name: `${m.firstname} ${m.lastname}`,
          email: m.email,
          profilepic: m.profilepic,
        }
      : { name: "Unknown", email: userId, profilepic: "" };
  }

  function getSubmitterDetails(id?: string) {
    if (!id) return null;
    const s = submitters.find((s) => s.UserId === id);
    return s
      ? {
          name: `${s.firstname} ${s.lastname}`,
          email: s.email,
          profilepic: s.profilepic,
        }
      : { name: "Unknown", email: id, profilepic: "" };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-destructive/20 p-6 rounded-md max-w-sm mx-auto">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            className="mt-4 w-full sm:w-auto"
            onClick={() => router.push("/teamData/ProfileTeam")}
          >
            Return to Team Profile
          </Button>
        </div>
      </div>
    );
  }

  const filtered = tasks.filter((t) => {
    const matchSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      t.status.toLowerCase() === statusFilter.toLowerCase();
    const matchAssigned =
      !showAssignedOnly ||
      (currentUser && t.assignedTo.includes(currentUser.UserId));

    if (activeTab === "pending")
      return matchSearch && matchAssigned && t.status === "Pending";
    if (activeTab === "in-progress")
      return matchSearch && matchAssigned && t.status === "In Progress";
    if (activeTab === "completed")
      return matchSearch && matchAssigned && t.status === "Completed";

    return matchSearch && matchStatus && matchAssigned;
  });

  const sortedTasks = filtered.sort((a, b) => {
    const order: Record<string, number> = {
      "Re Assigned": 1,
      Pending: 2,
      "In Progress": 3,
      Completed: 4,
    };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{projectName}</h1>
        <p className="text-muted-foreground">
          Manage and track your project tasks
        </p>
      </div>

      <div className="bg-card shadow-sm rounded-lg p-2 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-auto"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-auto">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="re assigned">Re-Assigned</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showAssignedOnly ? "default" : "outline"}
            onClick={() => setShowAssignedOnly((x) => !x)}
            className="w-full sm:w-auto"
          >
            {showAssignedOnly ? "My Tasks" : "All Tasks"}
          </Button>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center p-6 bg-muted/20 rounded-lg">
          <Info className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-xl font-medium mb-2">No tasks found</h3>
          <p className="text-muted-foreground">
            {showAssignedOnly
              ? "You have no tasks assigned matching filters."
              : "No tasks match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTasks.map((task) => {
            const me =
              currentUser && task.assignedTo.includes(currentUser.UserId);
            const dl = new Date(task.deadline);
            const past = dl < new Date();
            const sd = getStatusDetails(task.status);
            const canUpdate = me && task.status === "In Progress";

            let border = "";
            let bg = "";
            if (task.status === "Completed") {
              border = "border-l-4 border-green-500";
              bg = "bg-green-50";
            } else if (task.status === "In Progress") {
              border = "border-l-4 border-blue-500";
              bg = "bg-blue-50";
            } else if (task.status === "Re Assigned") {
              border = "border-l-4 border-amber-500";
              bg = "bg-amber-50";
            }

            return (
              <Card
                key={task.TaskId}
                className={cn(
                  "transition-all duration-300 group relative",
                  border,
                  bg,
                  me &&
                    task.status !== "Completed" &&
                    "hover:shadow-lg hover:-translate-y-1"
                )}
              >
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    me && task.status !== "Completed" && handleCardClick(task)
                  }
                >
                  <CardHeader className="px-3 sm:px-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg sm:text-xl">
                        {task.title}
                      </CardTitle>
                      <Badge
                        variant={sd.variant}
                        className={cn(
                          "flex items-center text-xs sm:text-sm",
                          sd.className
                        )}
                      >
                        {sd.icon}
                        {task.status}
                      </Badge>
                    </div>
                    <CardDescription className="mt-2 line-clamp-2 text-sm sm:text-base">
                      {task.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-3 sm:px-4 pb-2 space-y-4">
                    <div className="flex items-start space-x-2">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Deadline</p>
                        <p
                          className={`text-sm ${past ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {dl.toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">Assigned to:</p>
                      <div className="flex flex-wrap gap-2">
                        {task.assignedTo.map((uid) => {
                          const u = getUserDetails(uid);
                          const isMe = currentUser?.UserId === uid;
                          return (
                            <TooltipProvider key={uid}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      "flex items-center gap-1 rounded-full px-2 py-1 text-xs",
                                      isMe
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                                      <AvatarImage
                                        src={u.profilepic}
                                        alt={u.name}
                                      />
                                      <AvatarFallback>
                                        {u.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate max-w-[80px] sm:max-w-[100px]">
                                      {u.name}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{u.email}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="px-3 sm:px-4 pt-0 flex justify-between items-center">
                    <div className="flex-1">
                      {task.status === "In Progress" && (
                        <Button
                          variant="ghost"
                          className="text-blue-600 text-sm sm:text-base"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskDetails(task);
                          }}
                        >
                          <Info className="h-4 w-4 mr-1" />
                          View Implementation
                        </Button>
                      )}
                      {task.status === "Completed" && (
                        <Button
                          variant="ghost"
                          className="text-green-600 text-sm sm:text-base"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskDetails(task);
                          }}
                        >
                          <Github className="h-4 w-4 mr-1" />
                          View Implementation
                        </Button>
                      )}
                      {task.status === "Re Assigned" && me && (
                        <Button
                          variant="ghost"
                          className="text-amber-600 text-sm sm:text-base"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReassignedTask(task);
                          }}
                        >
                          <Info className="h-4 w-4 mr-1" />
                          View Feedback
                        </Button>
                      )}
                    </div>
                    {canUpdate && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 hover:bg-blue-200 hover:border hover:border-blue-500 hover:text-black"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCardClick(task);
                                }}
                              >
                                <PenTool className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Update this task</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </CardFooter>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!selectedTask}
        onOpenChange={(o) => !o && setSelectedTask(null)}
      >
        <DialogContent className="w-full max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Task Update</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                GitHub URL
              </label>
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://github.com/..."
                  value={gitHubUrl}
                  onChange={(e) => setGitHubUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Implementation Details
              </label>
              <Textarea
                placeholder="Explain your approach..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setSelectedTask(null)}
            >
              Cancel
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleSubmitTask}>
              Upload Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedTaskDetails}
        onOpenChange={(o) => !o && setSelectedTaskDetails(null)}
      >
        <DialogContent className="w-full max-w-sm sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedTaskDetails?.title} – Implementation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedTaskDetails?.submittedby && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Submitted by:</h4>
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                  {(() => {
                    const sub = getSubmitterDetails(
                      selectedTaskDetails.submittedby
                    );
                    if (!sub) return <p>Unknown user</p>;
                    return (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={sub.profilepic} alt={sub.name} />
                          <AvatarFallback>{sub.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{sub.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sub.email}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">GitHub URL:</h4>
              <div className="flex items-center gap-2">
                <Input
                  value={selectedTaskDetails?.gitHubUrl || ""}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(selectedTaskDetails?.gitHubUrl || "")
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Implementation Details:</h4>
              <Textarea
                value={
                  selectedTaskDetails?.context || "No explanation provided"
                }
                readOnly
                rows={6}
                className="bg-muted/30"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!reassignedTask}
        onOpenChange={(o) => !o && setReassignedTask(null)}
      >
        <DialogContent className="w-full max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Feedback on {reassignedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Feedback:</h4>
              <div className="border border-amber-200 rounded-md p-3">
                <Textarea
                  value={reassignedTask?.context || "No feedback provided"}
                  readOnly
                  rows={6}
                  className="bg-transparent border-0 focus-visible:ring-0 resize-none"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              className="w-full sm:w-auto"
              onClick={() => setReassignedTask(null)}
            >
              Close
            </Button>
            <Button
              variant="default"
              className="w-full sm:w-auto"
              onClick={() => {
                if (reassignedTask) handleCardClick(reassignedTask);
                setReassignedTask(null);
              }}
            >
              Submit Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
