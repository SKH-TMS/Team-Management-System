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
  Calendar,
  Clock,
  AlertCircle,
  Check,
  Loader2,
  UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ISubtask {
  SubtaskId: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  assignedTo: string[] | string;
  gitHubUrl?: string;
  context?: string;
}

interface ITask {
  TaskId: string;
  title: string;
  description?: string;
  deadline?: string;
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showMine, setShowMine] = useState(false);

  // submission dialog state
  const [selected, setSelected] = useState<ISubtask | null>(null);
  const [gitHubUrl, setGitHubUrl] = useState("");
  const [context, setContext] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!parentTaskId) {
      setError("Missing Task ID");
      setLoading(false);
      return;
    }
    if (!loading) setRefreshing(true);
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
      setRefreshing(false);
    }
  }, [parentTaskId, loading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterAndSort = subtasks
    .filter((st) =>
      showMine
        ? Array.isArray(st.assignedTo)
          ? st.assignedTo.includes(currentUserId)
          : st.assignedTo === currentUserId
        : true
    )
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );

  const isOverdue = (d: string) => new Date(d) < new Date();
  const isDueSoon = (d: string) => {
    const diff = new Date(d).getTime() - Date.now();
    return diff > 0 && diff < 1000 * 60 * 60 * 24;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "in progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center">
            <Clock className="mr-1 w-3 h-3" /> In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center">
            <Check className="mr-1 w-3 h-3" /> Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full flex items-center">
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
      default:
        return "bg-card border";
    }
  };

  const openSubmit = (st: ISubtask) => {
    setSelected(st);
    setGitHubUrl(st.gitHubUrl || "");
    setContext(st.context || "");
  };
  const closeSubmit = () => {
    setSelected(null);
    setGitHubUrl("");
    setContext("");
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
          body: JSON.stringify({ gitHubUrl, context }),
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
            ? { ...st, status: "In Progress", gitHubUrl, context }
            : st
        )
      );
      closeSubmit();
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Submit failed";
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <Skeleton className="h-16 w-full rounded-lg mb-4" />
          <Skeleton className="h-6 w-3/4 mx-auto rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
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
        <div className="flex justify-center">
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Header */}
      <Card className="mb-6 bg-muted/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary" />
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="absolute top-4 left-4 h-8 w-8 rounded-full p-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle className="text-xl sm:text-2xl text-center pt-2">
            {parentTask?.title || "Task"}
          </CardTitle>
          {parentTask?.description && (
            <p className="text-center text-muted-foreground pt-1 max-w-xl mx-auto">
              {parentTask.description}
            </p>
          )}
        </CardHeader>
        {parentTask?.deadline && (
          <div className="text-xs sm:text-sm text-muted-foreground text-center pb-4 flex items-center justify-center">
            <Calendar className="w-3 h-3 mr-1 inline" />
            Deadline: {format(new Date(parentTask.deadline), "PPPp")}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant={showMine ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowMine((v) => !v)}
          className="flex items-center"
        >
          {showMine ? (
            <>
              <Filter className="mr-2 w-4 h-4" />
              Show All
            </>
          ) : (
            <>
              <UserIcon className="mr-2 w-4 h-4" />
              My Subtasks
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing" : "Refresh"}
        </Button>
      </div>

      {/* Grid */}
      {filterAndSort.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">
            {showMine
              ? "No subtasks assigned to you."
              : "No subtasks available."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filterAndSort.map((st) => (
            <Card
              key={st.SubtaskId}
              className={cn(
                "border hover:shadow transition-shadow flex flex-col",
                getBgColor(st.status, st.deadline)
              )}
              onClick={() =>
                st.status === "Pending" &&
                (Array.isArray(st.assignedTo)
                  ? st.assignedTo.includes(currentUserId)
                  : st.assignedTo === currentUserId) &&
                openSubmit(st)
              }
            >
              <CardHeader className="flex justify-between items-start px-4 pt-4 pb-2">
                <CardTitle className="text-base font-semibold line-clamp-2">
                  {st.title}
                </CardTitle>
                {getStatusBadge(st.status)}
              </CardHeader>
              <CardContent className="flex-grow px-4 pb-2 text-sm text-muted-foreground">
                <p className="line-clamp-2 mb-3">{st.description}</p>
                <div
                  className={cn(
                    "text-xs flex items-center mb-2",
                    isOverdue(st.deadline) &&
                      st.status.toLowerCase() !== "completed"
                      ? "text-red-600"
                      : isDueSoon(st.deadline) &&
                          st.status.toLowerCase() !== "completed"
                        ? "text-amber-600"
                        : "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-1 w-3 h-3" />
                  {isOverdue(st.deadline)
                    ? "Overdue: "
                    : isDueSoon(st.deadline)
                      ? "Due soon: "
                      : "Due: "}
                  {format(new Date(st.deadline), "PPP")}
                </div>
                {st.status === "Pending" &&
                  (Array.isArray(st.assignedTo)
                    ? st.assignedTo.includes(currentUserId)
                    : st.assignedTo === currentUserId) && (
                    <p className="mt-1 text-xs text-blue-600">
                      (click to Submit)
                    </p>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submit Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && closeSubmit()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit: {selected?.title}</DialogTitle>
            <DialogDescription>
              Enter your GitHub URL & context
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="github-url">GitHub URL</Label>
              <Input
                id="github-url"
                value={gitHubUrl}
                onChange={(e) => setGitHubUrl(e.target.value)}
                placeholder="https://github.com/your/repo"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="context">Context / Notes</Label>
              <Textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
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
  );
}
