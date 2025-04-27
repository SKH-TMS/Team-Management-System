"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import {
  ArrowLeft,
  Filter,
  RefreshCw,
  Search as SearchIcon,
  Calendar,
  Clock,
  AlertCircle,
  Check,
  Send,
  Copy,
  Info,
  Loader2,
  Github,
  ListFilter,
  ChevronRight,
  CalendarClock,
  User,
  Users,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader as ADHeader,
  AlertDialogTitle as ADTitle,
  AlertDialogDescription as ADDesc,
  AlertDialogFooter as ADFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

interface ISubtask {
  SubtaskId: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  assignedMembers: Member[];
  gitHubUrl?: string;
  context?: string;
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

interface ApiResponse {
  success: boolean;
  parentTask: ITask;
  subtasks: ISubtask[];
  currentUserId: string;
  message?: string;
}

export default function TeamMemberSubtasksPage() {
  const { taskId: parentTaskId } = useParams() as { taskId: string };
  const router = useRouter();

  const [parentTask, setParentTask] = useState<ITask | null>(null);
  const [subtasks, setSubtasks] = useState<ISubtask[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [showMine, setShowMine] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [viewDetails, setViewDetails] = useState<ISubtask | null>(null);
  const [confirmResubmit, setConfirmResubmit] = useState<ISubtask | null>(null);
  const [selected, setSelected] = useState<ISubtask | null>(null);

  const [gitHubUrl, setGitHubUrl] = useState("");
  const [contextText, setContextText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!parentTaskId) return;

    setError("");
    try {
      const res = await fetch(
        `/api/teamData/teamMemberData/getSubtasks/${parentTaskId}`
      );
      const data: ApiResponse = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load subtasks");
      }
      setParentTask(data.parentTask);
      setSubtasks(data.subtasks);
      setCurrentUserId(data.currentUserId);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Error loading subtasks";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [parentTaskId, loading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isOverdue = (d: string) => new Date(d) < new Date();
  const isDueSoon = (d: string) => {
    const diff = new Date(d).getTime() - Date.now();
    return diff > 0 && diff < 1000 * 60 * 60 * 24;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
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
      case "re assigned":
        return (
          <Badge className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full flex items-center hover:bg-gray-200">
            <AlertCircle className="mr-1 w-3 h-3" /> Reassigned
          </Badge>
        );
      default:
        return (
          <Badge className="text-xs px-2 py-0.5 rounded-full">{status}</Badge>
        );
    }
  };

  const getBgColor = (status: string, deadline: string) => {
    if (isOverdue(deadline) && status.toLowerCase() !== "completed") {
      return "bg-red-50 border-red-200";
    }
    switch (status.toLowerCase()) {
      case "in progress":
        return "bg-blue-50 border-blue-200";
      case "completed":
        return "bg-green-50 border-green-200";
      case "pending":
        return "bg-gray-50 border-gray-200";
      case "re assigned":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-card border";
    }
  };

  const getBorderColor = (status: string, deadline: string) => {
    if (isOverdue(deadline) && status.toLowerCase() !== "completed") {
      return "border-red-400";
    }
    switch (status.toLowerCase()) {
      case "in progress":
        return "border-blue-400";
      case "completed":
        return "border-green-400";
      case "pending":
        return "border-gray-400";
      case "re assigned":
        return "border-amber-400";
      default:
        return "border-gray-200";
    }
  };

  const filtered = subtasks
    .filter((st) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesText =
        !q ||
        st.title.toLowerCase().includes(q) ||
        st.description.toLowerCase().includes(q);
      const matchesMine = showMine
        ? st.assignedMembers.some((m) => m.UserId === currentUserId)
        : true;
      return matchesText && matchesMine;
    })
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );

  const openDetails = (st: ISubtask) => setViewDetails(st);
  const closeDetails = () => setViewDetails(null);

  const handleSubmitClick = (st: ISubtask) => {
    if (st.gitHubUrl) setConfirmResubmit(st);
    else openSubmit(st);
  };

  const cancelResubmit = () => setConfirmResubmit(null);
  const confirmResubmitAndOpen = () => {
    if (!confirmResubmit) return;
    openSubmit(confirmResubmit);
    setConfirmResubmit(null);
  };

  const openSubmit = (st: ISubtask) => {
    setSelected(st);
    setGitHubUrl(st.gitHubUrl || "");
    setContextText(st.context || "");
  };
  const closeSubmit = () => {
    setSelected(null);
    setGitHubUrl("");
    setContextText("");
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/teamData/teamMemberData/submitSubtask/${selected.SubtaskId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gitHubUrl, context: contextText }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Submit failed");
      }
      toast.success("Submitted!");
      setSubtasks((prev) =>
        prev.map((st) =>
          st.SubtaskId === selected.SubtaskId
            ? {
                ...st,
                status: "In Progress",
                gitHubUrl,
                context: contextText,
              }
            : st
        )
      );
      closeSubmit();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Submit failed");
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (txt?: string) => {
    if (!txt) return;
    navigator.clipboard.writeText(txt).then(() => {
      toast.success("Copied to clipboard");
    });
  };

  const getCompletionPercentage = () => {
    if (!subtasks.length) return 0;
    const completed = subtasks.filter(
      (st) => st.status.toLowerCase() === "completed"
    ).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return "Overdue";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} day${days !== 1 ? "s" : ""} left`;

    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${hours} hour${hours !== 1 ? "s" : ""} left`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="animate-pulse">
          <Skeleton className="h-20 w-full rounded-lg mb-6" />
          <div className="flex justify-between mb-6">
            <Skeleton className="h-10 w-64 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
        <Alert variant="destructive" className="mb-6 shadow-md">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-semibold">
            Error Loading Subtasks
          </AlertTitle>
          <AlertDescription className="mt-2">{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchData} className="gap-2 shadow-sm">
          <RefreshCw className="h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 sm:p-6">
        {/* Parent Task Info */}
        {parentTask && (
          <Card className="mb-8 bg-gradient-to-r from-slate-50 to-gray-50 shadow-md backdrop-blur overflow-hidden">
            <CardHeader className="relative pb-2">
              <div className="absolute -top-1 -left-1 p-1">
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
                {parentTask.title}
              </CardTitle>
              {parentTask.description && (
                <CardDescription className="text-center text-muted-foreground px-4 mt-2 line-clamp-2">
                  {parentTask.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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
                  {getStatusBadge(parentTask.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-3 -mx-3 rounded-lg shadow-sm">
          <div className="relative w-full sm:w-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search subtasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64 bg-white border-none shadow-sm focus-visible:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showMine ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMine((v) => !v)}
              className={cn(
                "transition-all duration-200",
                showMine ? "shadow-md" : "hover:bg-primary/5"
              )}
            >
              <ListFilter className="mr-2 w-4 h-4" />
              {showMine ? "My Tasks" : "All Tasks"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              aria-label="Refresh"
              className="w-9 h-9 p-0 rounded-full hover:bg-primary/5 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-lg border-2 border-dashed border-muted text-center">
            <FileText className="w-12 h-12 text-muted mb-3" />
            <h3 className="text-lg font-medium mb-2">No subtasks found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || showMine
                ? "Try changing your search or filter settings"
                : "There are no subtasks assigned to this task yet"}
            </p>
            {(searchQuery || showMine) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setShowMine(false);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Subtask Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((st) => (
            <Card
              key={st.SubtaskId}
              className={cn(
                "relative overflow-hidden rounded-lg shadow-sm hover:shadow-lg border-2 flex flex-col group transform transition-all duration-300 hover:-translate-y-1",
                getBgColor(st.status, st.deadline),
                getBorderColor(st.status, st.deadline)
              )}
              onClick={() => openDetails(st)}
            >
              {st.assignedMembers.some((m) => m.UserId === currentUserId) && (
                <div className="absolute top-0 right-0 h-6 w-6 bg-primary transform rotate-45 translate-x-3 -translate-y-3"></div>
              )}
              <CardHeader className="px-4 pt-4 pb-2">
                <div className="flex justify-between items-start mb-2">
                  {getStatusBadge(st.status)}
                  <div
                    className={cn(
                      "text-xs px-2 py-1 rounded-full flex items-center",
                      isOverdue(st.deadline) &&
                        st.status.toLowerCase() !== "completed"
                        ? "bg-red-100 text-red-800"
                        : isDueSoon(st.deadline) &&
                            st.status.toLowerCase() !== "completed"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-800"
                    )}
                  >
                    <CalendarClock className="mr-1 w-3 h-3" />
                    {getTimeRemaining(st.deadline)}
                  </div>
                </div>
                <CardTitle className="text-lg font-semibold line-clamp-2">
                  {st.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow px-4 pb-2 text-sm text-muted-foreground">
                <p className="line-clamp-3 mb-4">{st.description}</p>
                <div className="flex items-center mt-4">
                  <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                  <div className="flex -space-x-2">
                    {st.assignedMembers.map((m) => (
                      <Tooltip key={m.UserId}>
                        <TooltipTrigger asChild>
                          <Avatar className="h-6 w-6 sm:h-7 sm:w-7 ring-2 ring-white transform transition-transform hover:scale-110">
                            <AvatarImage src={m.profilepic} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {m.firstname[0]}
                              {m.lastname[0]}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-white border shadow-md p-2"
                        >
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={m.profilepic} />
                              <AvatarFallback>
                                {m.firstname[0]}
                                {m.lastname[0]}
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
                </div>
              </CardContent>
              <CardFooter className="px-4 pt-2 pb-4 flex justify-between items-center border-t border-muted/20 mt-2">
                <div className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="mr-1 w-3 h-3" />
                  {format(new Date(st.deadline), "MMM d")}
                </div>
                {st.assignedMembers.some((m) => m.UserId === currentUserId) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmitClick(st);
                    }}
                    className="flex items-center gap-1 h-8 hover:bg-primary/10 text-primary rounded-full"
                    aria-label="Submit Subtask"
                  >
                    <Send className="w-3 h-3" />
                    <span className="text-xs">
                      {st.gitHubUrl ? "Update" : "Submit"}
                    </span>
                  </Button>
                )}
              </CardFooter>
              {st.gitHubUrl && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/30"></div>
              )}
            </Card>
          ))}
        </div>

        {/* DETAILS DIALOG */}
        <Dialog
          open={!!viewDetails}
          onOpenChange={(open) => !open && closeDetails()}
        >
          <DialogContent className="max-w-md sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5" /> {viewDetails?.title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Subtask details and submission information
              </DialogDescription>
            </DialogHeader>
            {viewDetails && (
              <div className="space-y-5 py-2 text-sm">
                <div className="bg-muted/20 p-3 rounded-md">
                  <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Description
                  </Label>
                  <p className="whitespace-pre-line">
                    {viewDetails.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/20 p-3 rounded-md">
                    <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Deadline
                    </Label>
                    <p className="font-medium">
                      {format(new Date(viewDetails.deadline), "PPP")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(viewDetails.deadline), "p")}
                    </p>
                  </div>

                  <div className="bg-muted/20 p-3 rounded-md">
                    <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Status
                    </Label>
                    <div className="mt-1">
                      {getStatusBadge(viewDetails.status)}
                    </div>
                  </div>
                </div>

                <div className="bg-muted/20 p-3 rounded-md">
                  <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Assigned To
                  </Label>
                  <div className="flex flex-col gap-2">
                    {viewDetails.assignedMembers.map((m) => (
                      <div
                        key={m.UserId}
                        className="flex items-center space-x-2 bg-white/50 p-2 rounded-md"
                      >
                        <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                          <AvatarImage
                            src={m.profilepic}
                            alt={`${m.firstname} ${m.lastname}`}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {m.firstname[0]}
                            {m.lastname[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium block">
                            {m.firstname} {m.lastname}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {m.email}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {viewDetails.gitHubUrl && (
                  <div className="bg-muted/20 p-3 rounded-md">
                    <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Github className="w-3 h-3" /> GitHub URL
                    </Label>
                    <div className="flex items-center mt-1 bg-white/60 p-2 rounded border border-muted">
                      <a
                        href={viewDetails.gitHubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm break-all flex-1 truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {viewDetails.gitHubUrl}
                      </a>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(viewDetails.gitHubUrl, "_blank");
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
                            copyToClipboard(viewDetails.gitHubUrl);
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

                {viewDetails.context && (
                  <div className="bg-muted/20 p-3 rounded-md">
                    <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Context / Notes
                    </Label>
                    <div className="mt-1 bg-white/60 p-2 rounded border border-muted">
                      <p className="whitespace-pre-line text-sm">
                        {viewDetails.context}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="flex gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="outline" className="flex-1">
                  Close
                </Button>
              </DialogClose>
              {viewDetails?.assignedMembers.some(
                (m) => m.UserId === currentUserId
              ) && (
                <Button
                  onClick={() => handleSubmitClick(viewDetails)}
                  className="flex-1 gap-1"
                >
                  <Send className="w-4 h-4" />
                  {viewDetails.gitHubUrl ? "Update Submission" : "Submit Work"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* RESUBMIT CONFIRMATION */}
        <AlertDialog
          open={!!confirmResubmit}
          onOpenChange={(open) => !open && cancelResubmit()}
        >
          <AlertDialogContent className="max-w-md">
            <ADHeader>
              <ADTitle className="text-lg font-semibold">
                Update Submission?
              </ADTitle>
              <ADDesc className="mt-2">
                You already submitted this subtask. Updating will replace your
                current submission with new information.
              </ADDesc>
            </ADHeader>
            <ADFooter className="flex gap-2 mt-4">
              <AlertDialogCancel onClick={cancelResubmit} className="flex-1">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmResubmitAndOpen}
                className="flex-1 gap-1"
              >
                <Send className="w-4 h-4" /> Continue
              </AlertDialogAction>
            </ADFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* SUBMIT FORM */}
        <Dialog
          open={!!selected}
          onOpenChange={(open) => !open && closeSubmit()}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <Send className="w-5 h-5" />
                {selected?.gitHubUrl ? "Update Submission" : "Submit Work"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                {selected?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="github-url" className="flex items-center gap-1">
                  <Github className="w-4 h-4" /> GitHub URL
                </Label>
                <Input
                  id="github-url"
                  value={gitHubUrl}
                  onChange={(e) => setGitHubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="context" className="flex items-center gap-1">
                  <FileText className="w-4 h-4" /> Context / Notes
                </Label>
                <Textarea
                  id="context"
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Describe what you've done or add any additional notes..."
                  className="min-h-[120px] focus-visible:ring-primary/20"
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2 pt-2">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !gitHubUrl}
                className={cn(
                  "flex-1 gap-1",
                  !gitHubUrl && "opacity-70 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {selected?.gitHubUrl ? "Update" : "Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
