"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import {
  ArrowLeft,
  Filter,
  Clock,
  Check,
  AlertCircle,
  Calendar,
  User,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";

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

interface ISubtask {
  SubtaskId: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  assignedTo: string[];
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
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to load subtasks");
      setParentTask(data.parentTask);
      setSubtasks(data.subtasks);
      setCurrentUserId(data.currentUserId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error loading subtasks");
      toast.error(err.message || "Error loading subtasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [parentTaskId, loading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter & sort
  const displayed = subtasks
    .filter((st) => !showMine || st.assignedTo.includes(currentUserId))
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );

  // Deadline helpers
  const isDueSoon = (deadline: string) => {
    const now = new Date();
    const due = new Date(deadline);
    const diff = due.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    return hours > 0 && hours < 24;
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  // Helpers for badges & styling
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "in progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full flex items-center">
            <Check className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full flex items-center">
            <AlertCircle className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="text-xs px-2 py-0.5 rounded-full flex items-center">
            {status || "Unknown"}
          </Badge>
        );
    }
  };

  const getBgColor = (status: string, deadline: string) => {
    // Overdue tasks should stand out (unless completed)
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

  // Render loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <Skeleton className="h-16 w-full rounded-lg mb-4" />
          <Skeleton className="h-6 w-3/4 mx-auto rounded-lg" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array(8)
            .fill(0)
            .map((_, i) => (
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
          <AlertTitle className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Error
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex justify-center mt-4">
          <Button onClick={() => fetchData()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Parent Task Header */}
      <Card className="mb-6 bg-muted/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary"></div>
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="absolute top-4 left-4 h-8 w-8 rounded-full p-0 flex items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
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
            <Calendar className="h-3 w-3 mr-1 inline" />
            Deadline: {format(new Date(parentTask.deadline), "PPPp")}
          </div>
        )}
      </Card>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={refreshing}
          className="text-muted-foreground"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>

        <Button
          variant={showMine ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowMine((v) => !v)}
          className="flex items-center"
        >
          {showMine ? (
            <>
              <Filter className="mr-2 h-4 w-4" />
              Show All Subtasks
            </>
          ) : (
            <>
              <User className="mr-2 h-4 w-4" />
              Show My Subtasks
            </>
          )}
        </Button>
      </div>

      {/* Subtask Grid */}
      {displayed.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 border rounded-lg bg-card shadow-sm"
        >
          <div className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-muted p-3 mb-4">
              {showMine ? (
                <User className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Filter className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-medium mb-2">No subtasks found</h3>
            <p className="text-muted-foreground max-w-md">
              {showMine
                ? "There are no subtasks currently assigned to you for this task."
                : "There are no subtasks available for this task."}
            </p>
            {showMine && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowMine(false)}
              >
                View All Subtasks
              </Button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayed.map((st, index) => (
            <motion.div
              key={st.SubtaskId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card
                className={`border h-full hover:shadow-md transition-all duration-200 ${getBgColor(st.status, st.deadline)}`}
              >
                <CardHeader className="flex justify-between items-start px-4 pt-4 pb-2">
                  <CardTitle className="text-base font-semibold line-clamp-2">
                    {st.title}
                  </CardTitle>
                  {getStatusBadge(st.status)}
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground px-4 pb-2">
                  <p className="line-clamp-2 mb-3">{st.description}</p>
                </CardContent>
                <CardFooter className="px-4 pt-0 pb-4 flex flex-col items-start">
                  <div
                    className={`text-xs font-medium flex items-center mb-2 ${
                      isOverdue(st.deadline) &&
                      st.status.toLowerCase() !== "completed"
                        ? "text-red-600"
                        : isDueSoon(st.deadline) &&
                            st.status.toLowerCase() !== "completed"
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    <Calendar className="mr-1 h-3 w-3" />
                    {isOverdue(st.deadline) &&
                    st.status.toLowerCase() !== "completed"
                      ? "Overdue: "
                      : isDueSoon(st.deadline) &&
                          st.status.toLowerCase() !== "completed"
                        ? "Due soon: "
                        : "Due: "}
                    {format(new Date(st.deadline), "PPP")}
                  </div>

                  {st.assignedTo.includes(currentUserId) && (
                    <div className="flex items-center justify-center w-full mt-1">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 border-primary/20 text-primary text-xs flex items-center"
                      >
                        <User className="mr-1 h-3 w-3" />
                        Assigned to you
                      </Badge>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
