"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Import necessary components and icons
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils"; // Import cn utility

import {
  AlertCircle,
  Loader2,
  PlusCircle,
  ArrowLeft,
  User,
  Clock,
  Calendar as CalendarIcon, // Keep icon alias
  FileText,
  Save,
} from "lucide-react";

// --- Define or import types ---
interface ITask {
  TaskId: string;
  title: string;
}
interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
}
// --- End Type Definitions ---

// --- Zod Schema for Form Validation (Using string for date) ---
const subtaskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters." }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters." }),
  assignedTo: z
    .string()
    .min(1, { message: "Please select an assignee or 'All Members'." }),
  // Reverted to string for native date input
  deadlineDate: z
    .string()
    .min(1, { message: "Please select a deadline date." }),
  hour: z.string(),
  minute: z.string(),
  ampm: z.string(),
});
// --- End Zod Schema ---

export default function CreateSubTaskPage() {
  const params = useParams();
  const parentTaskId = params.taskId as string;
  const router = useRouter();

  // State
  const [parentTask, setParentTask] = useState<ITask | null>(null);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- React Hook Form Setup ---
  const form = useForm<z.infer<typeof subtaskFormSchema>>({
    resolver: zodResolver(subtaskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      assignedTo: "",
      deadlineDate: "", // Default to empty string for native date input
      hour: "17", // Default 5 PM
      minute: "00",
      ampm: "PM",
    },
  });
  // --- End Form Setup ---

  // Fetch Parent Task Title and Team Members
  const fetchCreationContext = useCallback(async () => {
    if (!parentTaskId) {
      setError("Parent Task ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/teamData/teamLeaderData/getSubtaskCreationContext/${parentTaskId}`,
        { method: "GET" }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch creation context.");
      }
      setParentTask(data.parentTask || null);
      setTeamMembers(data.teamMembers || []);
      if (!data.parentTask) {
        throw new Error("Parent task details not found.");
      }
    } catch (err: any) {
      console.error("Error fetching creation context:", err);
      const message = err.message || "Failed to load necessary data.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [parentTaskId]);

  useEffect(() => {
    fetchCreationContext();
  }, [fetchCreationContext]);

  // Helper to format time (remains the same)
  const getFormattedTime = (hour: string, minute: string, ampm: string) => {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minute}:00`;
  };

  // Handle Form Submission (Adjusted for date string)
  const onSubmit = async (values: z.infer<typeof subtaskFormSchema>) => {
    setSubmitting(true);
    setError("");

    let combinedDeadline: Date;
    try {
      // Combine date string and formatted time string
      const timeString = getFormattedTime(
        values.hour,
        values.minute,
        values.ampm
      );
      // Create Date object from the combined string
      combinedDeadline = new Date(`${values.deadlineDate}T${timeString}`);

      if (isNaN(combinedDeadline.getTime()))
        throw new Error("Invalid date/time format.");
      // Check if the date part itself is valid before time check
      if (new Date(values.deadlineDate).toString() === "Invalid Date") {
        throw new Error("Invalid deadline date selected.");
      }
      if (combinedDeadline < new Date()) {
        // More robust past check
        const now = new Date();
        now.setSeconds(0, 0); // Ignore seconds/ms for comparison if needed
        if (combinedDeadline < now) {
          toast.error("Deadline cannot be in the past.");
          setSubmitting(false);
          return;
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Invalid deadline format.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/teamData/teamLeaderData/createSubTask`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentTaskId: parentTaskId,
            title: values.title,
            description: values.description,
            assignedTo: values.assignedTo,
            deadline: combinedDeadline.toISOString(),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create subtask.");
      }

      toast.success("Subtask created successfully!");
      router.push(`/teamData/teamLeaderData/SubTasks/${parentTaskId}`);
    } catch (err: any) {
      console.error("Error creating subtask:", err);
      setError(err.message || "Failed to create subtask.");
      toast.error(err.message || "Failed to create subtask.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render Logic ---

  if (loading) {
    return (
      // --- SKELETON (Responsive) ---
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/2 mb-6" />
        <Card className="max-w-3xl mx-auto">
          {" "}
          {/* Slightly wider max-width */}
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
            {" "}
            {/* Increased spacing */}
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {" "}
              {/* Grid for deadline */}
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24 ml-auto" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  if (error && !parentTask) {
    return (
      // --- ERROR MESSAGE (Responsive) ---
      <div className="container mx-auto p-4 sm:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    // --- MAIN CONTENT AREA (Responsive Padding) ---
    <div className="container mx-auto py-6 px-4 md:px-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4 -ml-2 text-sm text-muted-foreground hover:text-primary" // Subtle back button
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Parent Task
      </Button>

      {/* --- FORM CARD (Responsive Max Width & Styling) --- */}
      <Card className="max-w-3xl mx-auto border shadow-sm">
        {" "}
        {/* Slightly wider max-width */}
        <CardHeader className="bg-muted/30 border-b p-4 sm:p-6">
          {" "}
          {/* Styled header */}
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-semibold">
            <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Create New Subtask
          </CardTitle>
          <CardDescription className="mt-1 text-sm">
            For Parent Task:{" "}
            <span className="font-medium text-foreground">
              {parentTask?.title || "Loading..."}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {error && !loading && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            {/* Increased vertical spacing between form elements */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">
                      Subtask Title*
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Implement user authentication"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">
                      Subtask Description*
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide details about the subtask requirements..."
                        className="min-h-[120px]" // Slightly taller textarea
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assignee */}
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Assign To*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee or 'All Members'" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__all__">
                          Assign to All Team Members
                        </SelectItem>
                        <Separator className="my-1" />
                        {teamMembers.length === 0 && (
                          <SelectItem value="" disabled>
                            No members available
                          </SelectItem>
                        )}
                        {teamMembers.map((member) => (
                          <SelectItem key={member.UserId} value={member.UserId}>
                            {member.firstname} {member.lastname} ({member.email}
                            )
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Deadline Section (Improved Layout & Native Input) --- */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-base font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" /> Deadline*
                </h3>
                {/* Responsive Grid: Stacks on mobile, horizontal on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 items-start">
                  {/* Native Date Input */}
                  <FormField
                    control={form.control}
                    name="deadlineDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            min={new Date().toISOString().split("T")[0]} // Prevent past dates
                            className="appearance-none" // Improve cross-browser consistency
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Time Selection (Improved Grouping) */}
                  <div className="space-y-2">
                    <FormLabel>Time</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name="hour"
                        render={({ field }) => (
                          <FormItem>
                            {/* <FormLabel>Hour</FormLabel> */}{" "}
                            {/* Label removed, implied by group */}
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
                            {/* <FormLabel>Min</FormLabel> */}
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
                            {/* <FormLabel>AM/PM</FormLabel> */}
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
              </div>
              {/* --- End Deadline Section --- */}

              {/* Action Buttons (Responsive Footer) */}
              <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-8 px-0 pb-0">
                {" "}
                {/* Increased top padding */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="w-full sm:w-auto" // Full width on mobile
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || loading}
                  className="w-full sm:w-auto" // Full width on mobile
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Create Subtask
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
