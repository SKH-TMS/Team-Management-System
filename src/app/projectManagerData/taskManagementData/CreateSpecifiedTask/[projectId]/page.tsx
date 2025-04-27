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
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ClipboardList,
  Users, // Keep for showing Team info
  Calendar,
  Clock,
  XCircle,
  Info, // Added
  Loader2, // Added
  Briefcase, // Added for Project info
} from "lucide-react";
// Removed cn as it wasn't used directly here after removing member list styling

// Interface for the assignment details we need to fetch
interface AssignmentInfo {
  teamId: string;
  teamName: string;
  projectName: string; // Also fetch project name for context
}

export default function CreateTaskForProjectPage() {
  // Renamed component
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();

  // State for task details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [hour, setHour] = useState("17"); // Default 5 PM
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState<"AM" | "PM">("PM");

  // State for fetched assignment context
  const [assignmentInfo, setAssignmentInfo] = useState<AssignmentInfo | null>(
    null
  );

  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Time constants
  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = ["00", "15", "30", "45"];

  // Fetch assignment details (Team ID/Name) for the given Project ID
  useEffect(() => {
    if (!projectId) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    async function fetchAssignmentContext() {
      try {
        // This API needs to find the AssignedProjectLog for the projectId
        // and return teamId, teamName, projectName
        const res = await fetch(
          `/api/projectManagerData/taskManagementData/getAssignmentContext/${projectId}` // NEW API Endpoint needed
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to fetch assignment details for this project."
          );
        }
        if (!data.assignment) {
          throw new Error(
            "Project assignment details not found. Cannot create task."
          );
        }
        setAssignmentInfo(data.assignment);
      } catch (e: any) {
        console.error("Error fetching assignment context:", e);
        setError(e.message || "Failed to load project assignment details.");
        toast.error(e.message || "Failed to load project assignment details.");
        // Maybe redirect if assignment context is crucial and not found
        router.back();
      } finally {
        setLoading(false);
      }
    }
    fetchAssignmentContext();
  }, [projectId]); // Removed router dependency

  // Helper to format time
  const getFormattedTime = () => {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${minute}:00`;
  };

  // Handle Task Creation
  const handleTaskCreate = async () => {
    // Validation
    if (!assignmentInfo?.teamId) {
      toast.error("Team information is missing. Cannot create task.");
      return;
    }
    if (!title.trim()) return toast.error("Task title is required.");
    if (!description.trim())
      return toast.error("Task description is required.");
    if (!deadlineDate) return toast.error("Deadline date is required.");

    let combinedDeadline: Date;
    try {
      const timeString = getFormattedTime();
      combinedDeadline = new Date(`${deadlineDate}T${timeString}`);
      if (isNaN(combinedDeadline.getTime())) {
        throw new Error("Invalid date or time selected.");
      }
      if (combinedDeadline < new Date()) {
        toast.error("Deadline cannot be in the past.");
        return;
      }
    } catch (e: any) {
      return toast.error(e.message || "Invalid deadline format.");
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Use the standard task creation endpoint, passing projectId in URL
      const res = await fetch(
        `/api/projectManagerData/taskManagementData/createTask/${projectId}`, // Use the endpoint we already fixed
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Payload matches the refactored API route
            teamId: assignmentInfo.teamId, // Send the fetched teamId
            title: title.trim(),
            description: description.trim(),
            deadline: combinedDeadline.toISOString(),
            // REMOVED: assignedTo
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create task");
      }
      toast.success("Task created successfully!");
      // Navigate to the main task list or project-specific task list
      router.back();
      // Or maybe: router.push(`/projectManagerData/taskManagementData/ProjectTasks/${projectId}`);
    } catch (e: any) {
      console.error("Error creating task:", e);
      setError(e.message || "Failed to create task.");
      toast.error(e.message || "Failed to create task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
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
          <AlertTitle>Error</AlertTitle>
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

  if (!assignmentInfo) {
    // Should be covered by error state, but as a fallback
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTitle>Assignment Not Found</AlertTitle>
          <AlertDescription>
            Could not load assignment details for this project.
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
            <ClipboardList className="mr-2 h-5 w-5" />
            Create New Task
          </CardTitle>
          <p className="text-sm text-muted-foreground pt-1">
            For Project:{" "}
            <span className="font-medium">
              {assignmentInfo.projectName} ({projectId})
            </span>
            <br />
            Assigned to Team:{" "}
            <span className="font-medium">
              {assignmentInfo.teamName} ({assignmentInfo.teamId})
            </span>
          </p>
        </CardHeader>

        <CardContent className="space-y-4 pt-4 border-t">
          {/* Error Message Display */}
          {error &&
            !loading && ( // Show error only if not loading
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

          <div className="space-y-1">
            <Label htmlFor="task-title" className="font-medium">
              Task Title*
            </Label>
            <Input
              id="task-title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="task-desc" className="font-medium">
              Description*
            </Label>
            <Textarea
              id="task-desc"
              placeholder="Enter task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* REMOVED Member Assignment Section */}
          <Alert
            variant="default"
            className="bg-blue-50 border-blue-200 text-blue-800"
          >
            <Info className="h-4 w-4 !text-blue-800" />
            <AlertTitle className="font-medium">Team Assignment</AlertTitle>
            <AlertDescription className="text-xs">
              This task will be added to the assignment log for Team{" "}
              <span className="font-medium">{assignmentInfo.teamName}</span>.
              The Team Leader will manage subtasks and member assignments.
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
                  min={new Date().toISOString().split("T")[0]} // Prevent past dates
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
            onClick={handleTaskCreate}
            disabled={
              isSubmitting ||
              loading ||
              !title ||
              !description ||
              !deadlineDate ||
              !assignmentInfo
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Task"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
