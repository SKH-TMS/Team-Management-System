"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Edit2,
  // Users, // Removed Users icon as assignment is gone
  Calendar,
  Clock,
  XCircle,
  GitBranch,
  ClipboardList,
  MessageSquare,
  Info, // Added Info icon
  Loader2, // Added Loader icon
} from "lucide-react";
import { ITask } from "@/models/Task"; // Import your ITask interface

// Removed Member interface

export default function UpdateTaskPage() {
  // Using useParams correctly for Next.js App Router
  const params = useParams();
  const projectId = params.projectId as string; // Type assertion
  const taskId = params.taskId as string; // Type assertion
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  // const [members, setMembers] = useState<Member[]>([]); // Removed members state
  const [task, setTask] = useState<ITask | null>(null); // Use ITask type

  // State for editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [hour, setHour] = useState("17"); // Default 5 PM
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState<"AM" | "PM">("PM");
  // const [assignedTo, setAssignedTo] = useState<string>(""); // Removed assignedTo state

  // Time constants
  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = ["00", "15", "30", "45"];

  useEffect(() => {
    if (!taskId || !projectId) {
      setError("Task ID or Project ID missing.");
      setLoading(false);
      return;
    }

    async function fetchTaskDetails() {
      setLoading(true);
      setError("");
      try {
        // API endpoint needs to verify PM access based on projectId/taskId relationship
        const res = await fetch(
          `/api/projectManagerData/taskManagementData/getTaskDetails/${taskId}`,
          {
            method: "POST", // Or GET if preferred and secure
            headers: { "Content-Type": "application/json" },
            // Send projectId for verification if needed by API
            body: JSON.stringify({ projectId }),
          }
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch task details");
        }

        const fetchedTask: ITask = data.task; // Assume API returns ITask compatible object
        setTask(fetchedTask);
        // setMembers(data.members); // Removed members

        // Populate state with fetched task data
        setTitle(fetchedTask.title);
        setDescription(fetchedTask.description);

        // Safely parse deadline
        if (fetchedTask.deadline) {
          try {
            const d = new Date(fetchedTask.deadline);
            if (!isNaN(d.getTime())) {
              setDeadlineDate(d.toISOString().split("T")[0]);
              const hrs = d.getHours();
              setAmPm(hrs >= 12 ? "PM" : "AM");
              const hr12 = hrs % 12 || 12;
              setHour(String(hr12).padStart(2, "0"));
              setMinute(String(d.getMinutes()).padStart(2, "0"));
            } else {
              console.warn(
                "Invalid deadline date format received:",
                fetchedTask.deadline
              );
              // Set defaults or leave empty?
              setDeadlineDate("");
            }
          } catch (dateError) {
            console.error("Error parsing deadline:", dateError);
            setDeadlineDate("");
          }
        } else {
          setDeadlineDate(""); // Handle case where deadline might be missing
        }

        // setAssignedTo(data.task.assignedTo?.[0] ?? ""); // Removed assignedTo logic
      } catch (e: any) {
        console.error("Error fetching task:", e);
        const message = e.message || "Failed to load task details.";
        setError(message);
        toast.error(message);
        // Consider redirecting only on critical auth errors
        // router.push("/projectManagerData/taskManagementData/ManageTasks");
      } finally {
        setLoading(false);
      }
    }
    fetchTaskDetails();
  }, [projectId, taskId]); // Removed router dependency

  // Helper to format time for backend
  const getFormattedTime = (): string => {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minute}:00`;
  };

  // Handle Task Update Submission
  const handleSubmit = async () => {
    // Basic Validation
    if (!title.trim()) return toast.error("Title is required.");
    if (!description.trim()) return toast.error("Description is required.");
    if (!deadlineDate) return toast.error("Deadline date is required.");

    let combinedDeadline: Date;
    try {
      const timeString = getFormattedTime();
      combinedDeadline = new Date(`${deadlineDate}T${timeString}`);
      if (isNaN(combinedDeadline.getTime())) {
        throw new Error("Invalid date or time selected.");
      }
      if (combinedDeadline < new Date()) {
        // Allow past dates for update? Maybe not. Add check if needed.
        // toast.error("Deadline cannot be in the past."); return;
      }
    } catch (e: any) {
      return toast.error(e.message || "Invalid deadline format.");
    }

    setIsSubmitting(true);
    setError("");

    try {
      // API endpoint for updating the task
      const res = await fetch(
        "/api/projectManagerData/taskManagementData/updateTask",
        {
          method: "POST", // Or PUT/PATCH
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId, // Send taskId to identify the task
            title: title.trim(),
            description: description.trim(),
            deadline: combinedDeadline.toISOString(),
            // REMOVED: assignedTo
            // REMOVED: gitHubUrl, context (PM doesn't update these here)
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update task");
      }

      toast.success("Task updated successfully!");
      router.back(); // Go back to the previous page (likely the task list)
    } catch (e: any) {
      console.error("Error updating task:", e);
      const message = e.message || "Task update failed.";
      setError(message); // Show error near form
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-7 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24 ml-auto" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Task</AlertTitle>
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

  if (!task) {
    // Should be covered by error state, but as a fallback
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTitle>Task Not Found</AlertTitle>
          <AlertDescription>
            The requested task could not be loaded.
          </AlertDescription>
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
    <div className="container mx-auto py-6 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Edit2 className="mr-2 h-5 w-5" />
            Update Task Details
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Core Task Details */}
          <div className="space-y-1">
            <Label htmlFor="title" className="font-medium">
              Title*
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="desc" className="font-medium">
              Description*
            </Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter detailed task description"
              rows={5} // Slightly more rows
              required
            />
          </div>

          {/* REMOVED "Assign To" Section */}
          <Alert
            variant="default"
            className="bg-blue-50 border-blue-200 text-blue-800"
          >
            <Info className="h-4 w-4 !text-blue-800" />
            <AlertTitle className="font-medium">Team Assignment</AlertTitle>
            <AlertDescription className="text-xs">
              This task is assigned to the team. Subtask assignments are managed
              by the Team Leader.
            </AlertDescription>
          </Alert>

          {/* Deadline Section */}
          <div className="space-y-1 pt-4 border-t">
            <Label className="flex items-center font-medium mb-1">
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              Deadline*
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <div className="sm:col-span-2">
                <Label htmlFor="date" className="text-xs font-normal sr-only">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  required
                  className="w-full"
                  // min={new Date().toISOString().split("T")[0]} // Allow past dates for update? Maybe.
                />
              </div>

              <div className="grid grid-cols-3 gap-2 sm:col-span-2 items-center">
                <div>
                  <Label htmlFor="hour" className="text-xs font-normal sr-only">
                    Hour
                  </Label>
                  <Select onValueChange={setHour} value={hour}>
                    <SelectTrigger id="hour">
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={`h-${h}`} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="minute"
                    className="text-xs font-normal sr-only"
                  >
                    Minute
                  </Label>
                  <Select onValueChange={setMinute} value={minute}>
                    <SelectTrigger id="minute">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((m) => (
                        <SelectItem key={`m-${m}`} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ampm" className="text-xs font-normal sr-only">
                    AM/PM
                  </Label>
                  <Select
                    onValueChange={(v) => setAmPm(v as "AM" | "PM")}
                    value={ampm}
                  >
                    <SelectTrigger id="ampm">
                      <SelectValue placeholder="AM/PM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Display Submission Details (Read-Only) */}
          {(task.submittedby && task.submittedby !== "Not-submitted") ||
            (task.status === "Completed" && (
              <div className="pt-4 border-t space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Submission Details (Read-Only)
                </h3>
                <div className="space-y-1">
                  <Label
                    htmlFor="github-url"
                    className="flex items-center text-xs"
                  >
                    <GitBranch className="mr-2 h-4 w-4" />
                    Submitted GitHub URL
                  </Label>
                  <Input
                    id="github-url"
                    value={task.gitHubUrl || "N/A"}
                    readOnly
                    className="bg-muted/50 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="explanation"
                    className="flex items-center text-xs"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Submitted Explanation/Context
                  </Label>
                  <Textarea
                    id="explanation"
                    value={task.context || "No explanation provided."}
                    readOnly
                    rows={3}
                    className="bg-muted/50 text-sm"
                  />
                </div>
              </div>
            ))}

          {/* Display Feedback if Re-Assigned (Read-Only) */}
          {task.status === "Re Assigned" && (
            <div className="pt-4 border-t space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">
                Rejection Feedback (Read-Only)
              </h3>
              <Label
                htmlFor="feedback"
                className="flex items-center text-xs sr-only"
              >
                Feedback Provided
              </Label>
              <Textarea
                id="feedback"
                value={task.context || "No feedback recorded."} // Feedback is stored in context field
                readOnly
                rows={3}
                className="bg-amber-50 border-amber-200 text-amber-900 text-sm" // Style to indicate feedback
              />
            </div>
          )}

          {/* Error Message Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-end space-x-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !description || !deadlineDate}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Task"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
