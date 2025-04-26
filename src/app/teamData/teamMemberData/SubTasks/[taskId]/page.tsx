// src/app/teamData/teamMemberData/SubTasks/[taskId]/page.tsx
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
        `/api/teamData/teamMemberData/getsubtasks/${parentTaskId}`
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
            <AlertCircle className="mr-1 w-3 h-3" /> Pending
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

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Skeleton className="h-16 w-full rounded-lg mb-4" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchData}>Try Again</Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 sm:p-6">
        {/* Parent Task Info */}
        {parentTask && (
          <Card className="mb-6 bg-muted/50">
            <CardHeader className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="absolute top-4 left-4 h-8 w-8 rounded-full p-0"
                aria-label="Go back"
              >
                <ArrowLeft />
              </Button>
              <CardTitle className="text-xl sm:text-2xl text-center pt-2">
                {parentTask.title}
              </CardTitle>
              {parentTask.description && (
                <CardDescription className="text-center text-muted-foreground px-4 pb-4">
                  {parentTask.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground px-4 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Due:{" "}
                {parentTask.deadline
                  ? format(new Date(parentTask.deadline), "PPPp")
                  : "—"}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> Created:{" "}
                {format(new Date(parentTask.createdAt), "PPPp")}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> Updated:{" "}
                {format(new Date(parentTask.updatedAt), "PPPp")}
              </div>
              <div className="flex items-center justify-center sm:justify-start">
                {getStatusBadge(parentTask.status)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full sm:w-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search subtasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showMine ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowMine((v) => !v)}
            >
              <Filter className="mr-2 w-4 h-4" />
              {showMine ? "Show All" : "My Subtasks"}
            </Button>
          </div>
        </div>

        {/* Subtask Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((st) => (
            <Card
              key={st.SubtaskId}
              className={cn(
                " relative overflow-hidden rounded-lg shadow hover:shadow-2xl cursor-pointer border flex flex-col group border-l-4 transform hover:-translate-y-1 transition-all duration-300",
                getBgColor(st.status, st.deadline)
              )}
              onClick={() => openDetails(st)}
            >
              <CardHeader className="px-4 pt-4 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold line-clamp-2">
                    {st.title}
                  </CardTitle>
                  {getStatusBadge(st.status)}
                </div>
              </CardHeader>
              <CardContent className="flex-grow px-4 pb-2 text-sm text-muted-foreground">
                <p className="line-clamp-3 mb-4">{st.description}</p>
                <div className="flex -space-x-2 mb-4">
                  {st.assignedMembers.map((m) => (
                    <Tooltip key={m.UserId}>
                      <TooltipTrigger asChild>
                        <Avatar
                          className="h-6 w-6 sm:h-8 sm:w-8
                        ring-2 ring-white"
                        >
                          <AvatarImage src={m.profilepic} />
                          <AvatarFallback>
                            {m.firstname[0]}
                            {m.lastname[0]}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-gradient-to-br
                      from-slate-50 to-slate-100
                      text-black"
                      >
                        <p className="text-sm">
                          {m.firstname} {m.lastname} <br />
                          {m.email}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <div
                  className={cn(
                    "text-xs flex items-center",
                    isOverdue(st.deadline)
                      ? "text-red-600"
                      : isDueSoon(st.deadline)
                        ? "text-amber-600"
                        : "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-1 w-4 h-4" />
                  {isOverdue(st.deadline)
                    ? "Overdue: "
                    : isDueSoon(st.deadline)
                      ? "Due soon: "
                      : "Due: "}
                  {format(new Date(st.deadline), "PPP")}
                </div>
              </CardContent>
              <CardFooter className="px-4 pt-2 pb-4 flex justify-end items-center">
                {st.assignedMembers.some((m) => m.UserId === currentUserId) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation(), handleSubmitClick(st);
                    }}
                    aria-label="Submit Subtask"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* DETAILS DIALOG */}
        <Dialog
          open={!!viewDetails}
          onOpenChange={(open) => !open && closeDetails()}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Subtask: {viewDetails?.title}</DialogTitle>
              <DialogDescription>
                All details for this subtask
              </DialogDescription>
            </DialogHeader>
            {viewDetails && (
              <div className="space-y-4 py-2 text-sm">
                <div>
                  <Label>Description</Label>
                  <p>{viewDetails.description}</p>
                </div>
                <div>
                  <Label>Deadline</Label>
                  <p>{format(new Date(viewDetails.deadline), "PPPp")}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p>{viewDetails.status}</p>
                </div>
                <div>
                  <Label>Assigned To</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {viewDetails.assignedMembers.map((m) => (
                      <div
                        key={m.UserId}
                        className="flex items-center space-x-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={m.profilepic}
                            alt={`${m.firstname} ${m.lastname}`}
                          />
                          <AvatarFallback>
                            {m.firstname[0]}
                            {m.lastname[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {m.firstname} {m.lastname}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {viewDetails.gitHubUrl && (
                  <div>
                    <Label>Submitted URL</Label>
                    <div className="flex items-center space-x-2">
                      <a
                        href={viewDetails.gitHubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline break-all"
                      >
                        {viewDetails.gitHubUrl}
                      </a>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(viewDetails.gitHubUrl)}
                        aria-label="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {viewDetails.context && (
                  <div>
                    <Label>Context / Notes</Label>
                    <Textarea
                      readOnly
                      value={viewDetails.context}
                      className="bg-muted/30 border-none"
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="flex justify-end space-x-2">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              {viewDetails?.assignedMembers.some(
                (m) => m.UserId === currentUserId
              ) && (
                <Button onClick={() => handleSubmitClick(viewDetails)}>
                  {viewDetails.gitHubUrl ? "Resubmit" : "Submit"}
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
          <AlertDialogContent>
            <ADHeader>
              <ADTitle>Resubmit Subtask?</ADTitle>
              <ADDesc>
                You already submitted this subtask. Submitting again will
                overwrite your current submission. Continue?
              </ADDesc>
            </ADHeader>
            <ADFooter>
              <AlertDialogCancel onClick={cancelResubmit}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmResubmitAndOpen}>
                Continue
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
              <DialogTitle>
                {selected?.gitHubUrl ? "Resubmit" : "Submit"}: {selected?.title}
              </DialogTitle>
              <DialogDescription>
                Provide your GitHub URL & context
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="github-url">GitHub URL</Label>
                <Input
                  id="github-url"
                  value={gitHubUrl}
                  onChange={(e) => setGitHubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="context">Context / Notes</Label>
                <Textarea
                  id="context"
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <DialogFooter className="flex justify-end space-x-2">
              <DialogClose asChild>
                <Button variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !gitHubUrl}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                )}
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
