// src/app/teamData/teamLeaderData/CreateSubTask/[taskId]/page.tsx

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
} from "@/components/ui/form"; // Using Shadcn Form
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Loader2,
  PlusCircle,
  ArrowLeft,
  User,
  Clock,
  Calendar,
  FileText,
  Save,
} from "lucide-react";

// --- Define or import types ---
interface ITask {
  // Parent Task Details (simplified)
  TaskId: string;
  title: string;
}
interface Member {
  // Team Member Details
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
}
// --- End Type Definitions ---

// --- Zod Schema for Form Validation ---
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
    .min(1, { message: "Please assign this subtask to a team member." }), // Ensure a member is selected
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
  const parentTaskId = params.taskId as string; // Get parent TaskId from URL
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
      assignedTo: "", // Default to empty, validation requires selection
      deadlineDate: "",
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
        `/api/teamData/teamLeaderData/getSubtaskCreationContext/${parentTaskId}`, // Use the new context API
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
      // Optionally redirect if context fails
      // router.back();
    } finally {
      setLoading(false);
    }
  }, [parentTaskId]);

  useEffect(() => {
    fetchCreationContext();
  }, [fetchCreationContext]);

  // Helper to format time
  const getFormattedTime = (hour: string, minute: string, ampm: string) => {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minute}:00`;
  };

  // Handle Form Submission
  const onSubmit = async (values: z.infer<typeof subtaskFormSchema>) => {
    setSubmitting(true);
    setError("");

    let combinedDeadline: Date;
    try {
      const timeString = getFormattedTime(
        values.hour,
        values.minute,
        values.ampm
      );
      combinedDeadline = new Date(`${values.deadlineDate}T${timeString}`);
      if (isNaN(combinedDeadline.getTime()))
        throw new Error("Invalid date/time.");
      if (combinedDeadline < new Date()) {
        toast.error("Deadline cannot be in the past.");
        setSubmitting(false);
        return;
      }
    } catch (e: any) {
      toast.error(e.message || "Invalid deadline format.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/teamData/teamLeaderData/createSubTask`, // Use the new create API
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentTaskId: parentTaskId, // Include parent task ID
            title: values.title,
            description: values.description,
            assignedTo: values.assignedTo, // Send selected member ID
            deadline: combinedDeadline.toISOString(),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create subtask.");
      }

      toast.success("Subtask created successfully!");
      // Navigate back to the subtask list for the parent task
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
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/2 mb-6" />
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
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
  if (error && !parentTask) {
    // Show error prominently if context failed
    return (
      <div className="container mx-auto p-6">
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
    <div className="container mx-auto py-6 px-4 md:px-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Parent Task
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            Create New Subtask
          </CardTitle>
          <CardDescription>
            For Parent Task:{" "}
            <span className="font-medium">
              {parentTask?.title || "Loading..."}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Display general error if form submission fails */}
          {error && !loading && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-medium">
                      <FileText className="h-4 w-4" /> Subtask Title*
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter subtask title" {...field} />
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
                    <FormLabel className="flex items-center gap-2 font-medium">
                      <FileText className="h-4 w-4" /> Subtask Description*
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the subtask..."
                        className="min-h-[100px]"
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
                    <FormLabel className="flex items-center gap-2 font-medium">
                      <User className="h-4 w-4" /> Assign To*
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamMembers.length === 0 && (
                          <SelectItem value="" disabled>
                            No members found
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

              {/* Deadline */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Deadline*
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="deadlineDate"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            min={new Date().toISOString().split("T")[0]}
                            {...field}
                          />
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

              {/* Action Buttons */}
              <CardFooter className="flex justify-end space-x-3 pt-6 px-0 pb-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || loading}>
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
