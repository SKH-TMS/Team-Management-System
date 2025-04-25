"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ArrowLeft,
  Save,
  Loader2,
  ClipboardEdit,
  Calendar,
  Clock,
  // Users, // Removed
  FileText,
  Github,
  MessageSquare,
  AlertCircle,
  Info, // Added
  User, // Added for submitter display
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton
import { ITask } from "@/models/Task"; // Import updated ITask interface
import { Label } from "@/components/ui/label";

// Removed Member interface if not needed elsewhere

// --- CHANGE 1: Simplify Zod Schema ---
const formSchema = z.object({
  title: z.string().trim().min(3, {
    message: "Task title must be at least 3 characters.",
  }),
  description: z.string().trim().min(10, {
    message: "Task description must be at least 10 characters.",
  }),
  // assignedTo: z.string().optional(), // Removed
  deadlineDate: z.string().min(1, {
    message: "Please select a deadline date.",
  }),
  hour: z.string(),
  minute: z.string(),
  ampm: z.string(),
  // gitHubUrl: z.string().optional(), // Removed
  // context: z.string().optional(), // Removed
});

export default function UpdateSpecificTaskPage() {
  // Renamed component
  const params = useParams();
  const projectId = params.projectId as string;
  const taskId = params.taskId as string;
  const router = useRouter();

  // const [membersData, setMembersData] = useState<Member[]>([]); // Removed
  const [task, setTask] = useState<ITask | null>(null); // Use ITask type
  const [submitterName, setSubmitterName] = useState<string | null>(null); // State for submitter name
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- CHANGE 2: Simplify useForm default values ---
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      // assignedTo: "", // Removed
      deadlineDate: "",
      hour: "17", // Default 5 PM
      minute: "00",
      ampm: "PM",
      // gitHubUrl: "", // Removed
      // context: "", // Removed
    },
  });

  // Helper function (remains the same)
  function convertUTCtoLocalParts(utcDate: string | Date) {
    // Accept Date object too
    const date = new Date(utcDate);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date passed to convertUTCtoLocalParts:", utcDate);
      return {
        formattedDate: "",
        hourFormatted: "12",
        minuteFormatted: "00",
        ampm: "AM",
      };
    }

    const formattedDate = date.toISOString().split("T")[0];
    const hour = date.getHours();
    const minute = date.getMinutes();
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;

    const hourFormatted = String(hour12).padStart(2, "0");
    const minuteFormatted = String(minute).padStart(2, "0");

    return { formattedDate, hourFormatted, minuteFormatted, ampm };
  }

  // --- CHANGE 3: Update Fetch Logic ---
  useEffect(() => {
    if (!taskId || !projectId) {
      setError("Task ID or Project ID missing.");
      setLoading(false);
      return;
    }

    const fetchTaskAndSubmitter = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch task details (API already updated not to send members)
        const taskRes = await fetch(
          `/api/projectManagerData/taskManagementData/getTaskDetails/${taskId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }), // Send projectId for verification
          }
        );
        const taskData = await taskRes.json();

        if (!taskRes.ok || !taskData.success) {
          throw new Error(taskData.message || "Failed to fetch task details.");
        }

        const fetchedTask: ITask = taskData.task;
        setTask(fetchedTask);

        // Reset form with fetched data
        const { formattedDate, hourFormatted, minuteFormatted, ampm } =
          convertUTCtoLocalParts(fetchedTask.deadline);

        form.reset({
          title: fetchedTask.title,
          description: fetchedTask.description,
          deadlineDate: formattedDate,
          hour: hourFormatted,
          minute: minuteFormatted,
          ampm: ampm,
          // No assignedTo, gitHubUrl, context in form reset
        });

        // Fetch submitter details if submittedby exists
        if (
          fetchedTask.submittedby &&
          fetchedTask.submittedby !== "Not-submitted"
        ) {
          try {
            const submitterRes = await fetch(
              `/api/getUserDetails/${fetchedTask.submittedby}`
            ); // Assuming an endpoint exists
            const submitterData = await submitterRes.json();
            if (submitterData.success && submitterData.user) {
              setSubmitterName(
                `${submitterData.user.firstname} ${submitterData.user.lastname}`
              );
            } else {
              setSubmitterName(`User ID: ${fetchedTask.submittedby}`); // Fallback
            }
          } catch (submitterError) {
            console.error("Failed to fetch submitter details:", submitterError);
            setSubmitterName(`User ID: ${fetchedTask.submittedby}`); // Fallback
          }
        } else {
          setSubmitterName(null);
        }
      } catch (err: any) {
        console.error("Error fetching task:", err);
        setError(err.message || "Failed to load task details.");
        toast.error(err.message || "Failed to load task details.");
        // Consider redirecting only on critical errors
        // router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchTaskAndSubmitter();
  }, [taskId, projectId, form]); // Removed router dependency

  // Helper function (remains the same)
  const getFormattedTime = (hour: string, minute: string, ampm: string) => {
    let hourNum = Number.parseInt(hour);
    if (ampm === "PM" && hourNum !== 12) hourNum += 12;
    if (ampm === "AM" && hourNum === 12) hourNum = 0;
    return `${String(hourNum).padStart(2, "0")}:${minute}:00`;
  };

  // --- CHANGE 4: Update onSubmit Logic ---
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true);
    setError("");

    try {
      const formattedTime = getFormattedTime(
        values.hour,
        values.minute,
        values.ampm
      );
      const combinedDeadline = new Date(
        `${values.deadlineDate}T${formattedTime}`
      );

      if (isNaN(combinedDeadline.getTime())) {
        toast.error("Invalid date/time selection.");
        setSubmitting(false);
        return;
      }

      // Use the updated API endpoint and payload
      const response = await fetch(
        "/api/projectManagerData/taskManagementData/updateTask",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: taskId, // Ensure taskId is sent
            title: values.title,
            description: values.description,
            deadline: combinedDeadline.toISOString(),
            // REMOVED: assignedTo, gitHubUrl, context
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update task.");
      }

      toast.success("Task updated successfully!");
      router.back(); // Go back after successful update
    } catch (err: any) {
      console.error("Error updating task:", err);
      setError(err.message || "Failed to update task.");
      toast.error(err.message || "Failed to update task.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render Logic ---

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      {/* Breadcrumbs (remains the same) */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/projectManagerData/ProjectManagementData/ManageProject">
              Projects
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/projectManagerData/taskManagementData/ProjectTasks/${projectId}`}
            >
              Project Tasks
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {/* Use BreadcrumbPage for the current page */}
            <span className="text-foreground">Update Task</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="max-w-3xl mx-auto">
        {" "}
        {/* Increased max-width */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ClipboardEdit className="h-5 w-5" />
            Update Task
          </CardTitle>
          <CardDescription>
            Modify the core details of the task. Submission details and
            assignments are handled separately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {loading && (
            <div className="space-y-6 py-8">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Task</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form Display (only when not loading and no error) */}
          {!loading && !error && task && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Core Task Fields */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-medium">
                        <FileText className="h-4 w-4" />
                        Task Title*
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-medium">
                        <FileText className="h-4 w-4" />
                        Task Description*
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter task description"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* --- CHANGE 5: Remove AssignedTo FormField --- */}
                {/* <FormField ... name="assignedTo" ... /> */}

                {/* Info Alert */}
                <Alert
                  variant="default"
                  className="bg-blue-50 border-blue-200 text-blue-800"
                >
                  <Info className="h-4 w-4 !text-blue-800" />
                  <AlertTitle className="font-medium">
                    Team Assignment
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    This task is assigned at the team level. Subtask assignments
                    are managed by the Team Leader.
                  </AlertDescription>
                </Alert>

                {/* Deadline Fields */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Deadline*
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                    <FormField
                      control={form.control}
                      name="deadlineDate"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                      <FormField
                        control={form.control}
                        name="hour"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hour</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="HH" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 12 }, (_, i) =>
                                  String(i + 1).padStart(2, "0")
                                ).map((h) => (
                                  <SelectItem key={`h-${h}`} value={h}>
                                    {h}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="minute"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="MM" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {["00", "15", "30", "45"].map((m) => (
                                  <SelectItem key={`m-${m}`} value={m}>
                                    {m}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ampm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AM/PM</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="AM/PM" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="AM">AM</SelectItem>
                                <SelectItem value="PM">PM</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* --- CHANGE 6: Display Submission/Feedback Info Read-Only --- */}
                {(task.submittedby && task.submittedby !== "Not-submitted") ||
                task.status === "Completed" ||
                task.status === "Re Assigned" ? (
                  <div className="pt-4 border-t space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {task.status === "Re Assigned"
                        ? "Previous Submission / Feedback"
                        : "Submission Details"}{" "}
                      (Read-Only)
                    </h3>

                    {/* Submitter Info */}
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs font-medium">
                        <User className="w-4 h-4 mr-1.5" />
                        Submitted By
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {submitterName ||
                          (task.submittedby === "Not-submitted"
                            ? "N/A"
                            : `User ID: ${task.submittedby}`)}
                      </p>
                    </div>

                    {/* GitHub URL */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="readOnlyGitHubUrl"
                        className="flex items-center text-xs font-medium"
                      >
                        <Github className="h-4 w-4 mr-1.5" />
                        GitHub URL
                      </Label>
                      <Input
                        id="readOnlyGitHubUrl"
                        value={task.gitHubUrl || "N/A"}
                        readOnly
                        className="bg-muted/50 text-sm"
                      />
                    </div>

                    {/* Context / Feedback */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="readOnlyContext"
                        className="flex items-center text-xs font-medium"
                      >
                        <MessageSquare className="h-4 w-4 mr-1.5" />
                        {task.status === "Re Assigned"
                          ? "Feedback Provided"
                          : "Explanation/Context"}
                      </Label>
                      <Textarea
                        id="readOnlyContext"
                        value={
                          task.context ||
                          (task.status === "Re Assigned"
                            ? "No feedback recorded."
                            : "No explanation provided.")
                        }
                        readOnly
                        rows={3}
                        className={`bg-muted/50 text-sm ${task.status === "Re Assigned" ? "border-amber-300" : ""}`}
                      />
                    </div>
                  </div>
                ) : null}
                {/* --- End Read-Only Section --- */}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || loading || !form.formState.isDirty}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
