"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

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
import {
  AlertCircle,
  Loader2,
  ArrowLeft,
  User,
  Clock,
  Calendar,
  FileText,
  Save,
  FileEdit,
  Github,
  MessageSquare,
} from "lucide-react";

// --- Define or import types ---
interface ISubtask {
  SubtaskId: string;
  parentTaskId: string;
  title: string;
  description: string;
  assignedTo: string;
  deadline: string; // Expect ISO string from API initially
  status: string;
  gitHubUrl?: string;
  context?: string;
  submittedBy?: string;
  createdAt: string;
  updatedAt: string;
}
interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
}
// --- End Type Definitions ---

// --- Zod Schema for Form Validation ---
// Matches the editable fields
const updateSubtaskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters." }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters." }),
  assignedTo: z.string().min(1, { message: "Please assign this subtask." }),
  deadlineDate: z.string().min(1, { message: "Deadline date is required." }),
  hour: z.string(),
  minute: z.string(),
  ampm: z.string(),
});
// --- End Zod Schema ---

export default function UpdateSubTaskPage() {
  const params = useParams();
  const parentTaskId = params.taskId as string; // Parent Task ID
  const subtaskId = params.subtaskId as string; // Subtask ID being edited
  const router = useRouter();

  // State
  const [subtask, setSubtask] = useState<ISubtask | null>(null);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- React Hook Form Setup ---
  const form = useForm<z.infer<typeof updateSubtaskFormSchema>>({
    resolver: zodResolver(updateSubtaskFormSchema),
    defaultValues: {
      // Default values, will be overwritten by fetched data
      title: "",
      description: "",
      assignedTo: "",
      deadlineDate: "",
      hour: "17",
      minute: "00",
      ampm: "PM",
    },
  });
  // --- End Form Setup ---

  // Helper to convert UTC date string to local date/time parts for form
  const convertUTCtoLocalParts = useCallback((utcDateString?: string) => {
    if (!utcDateString)
      return {
        formattedDate: "",
        hourFormatted: "17",
        minuteFormatted: "00",
        ampm: "PM",
      };
    try {
      const date = new Date(utcDateString);
      if (isNaN(date.getTime())) throw new Error("Invalid Date");

      const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const hour = date.getHours();
      const minute = date.getMinutes();
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12; // Convert 0/12 hour format

      const hourFormatted = String(hour12).padStart(2, "0");
      const minuteFormatted = String(minute).padStart(2, "0");

      return { formattedDate, hourFormatted, minuteFormatted, ampm };
    } catch (e) {
      console.error("Error parsing date:", e);
      return {
        formattedDate: "",
        hourFormatted: "17",
        minuteFormatted: "00",
        ampm: "PM",
      }; // Return defaults on error
    }
  }, []);

  // Fetch Subtask Details and Team Members
  const fetchUpdateContext = useCallback(async () => {
    if (!subtaskId || !parentTaskId) {
      setError("Subtask ID or Parent Task ID missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      // --- CHANGE: Use new API endpoint ---
      // This API needs to fetch the subtask AND the team members associated with the parent task's team
      const response = await fetch(
        `/api/teamData/teamLeaderData/getSubtaskUpdateContext/${subtaskId}`,
        { method: "GET" } // Assuming GET is suitable
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch subtask details.");
      }

      if (!data.subtask) throw new Error("Subtask data not found.");

      const fetchedSubtask: ISubtask = data.subtask;
      setSubtask(fetchedSubtask);
      setTeamMembers(data.teamMembers || []); // Get members for assignee dropdown

      // Pre-fill the form with fetched data
      const { formattedDate, hourFormatted, minuteFormatted, ampm } =
        convertUTCtoLocalParts(fetchedSubtask.deadline);
      form.reset({
        title: fetchedSubtask.title,
        description: fetchedSubtask.description,
        assignedTo: fetchedSubtask.assignedTo || "", // Handle potentially unassigned case?
        deadlineDate: formattedDate,
        hour: hourFormatted,
        minute: minuteFormatted,
        ampm: ampm,
      });
    } catch (err: any) {
      console.error("Error fetching subtask update context:", err);
      const message = err.message || "Failed to load data for update.";
      setError(message);
      toast.error(message);
      // router.back(); // Go back if loading fails critically
    } finally {
      setLoading(false);
    }
  }, [subtaskId, parentTaskId, form, convertUTCtoLocalParts]); // Add dependencies

  useEffect(() => {
    fetchUpdateContext();
  }, [fetchUpdateContext]);

  // Helper to format time for backend submission
  const getFormattedTime = (hour: string, minute: string, ampm: string) => {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minute}:00`;
  };

  // Handle Form Submission
  const onSubmit = async (values: z.infer<typeof updateSubtaskFormSchema>) => {
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
      // Optional: Check if deadline is in the past
      // if (combinedDeadline < new Date()) { toast.error("Deadline cannot be in the past."); setSubmitting(false); return; }
    } catch (e: any) {
      toast.error(e.message || "Invalid deadline format.");
      setSubmitting(false);
      return;
    }

    try {
      // --- CHANGE: Use new API endpoint ---
      const response = await fetch(
        `/api/teamData/teamLeaderData/updateSubTask/${subtaskId}`, // Send subtaskId in URL
        {
          method: "PUT", // Use PUT or PATCH for updates
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Send only the updated fields from the form
            title: values.title,
            description: values.description,
            assignedTo: values.assignedTo,
            deadline: combinedDeadline.toISOString(),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update subtask.");
      }

      toast.success("Subtask updated successfully!");
      // Navigate back to the subtask list for the parent task
      router.push(`/teamData/teamLeaderData/SubTasks/${parentTaskId}`);
    } catch (err: any) {
      console.error("Error updating subtask:", err);
      setError(err.message || "Failed to update subtask.");
      toast.error(err.message || "Failed to update subtask.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render Logic ---

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subtasks
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <FileEdit className="h-5 w-5 sm:h-6 sm:w-6" />
            Update Subtask
          </CardTitle>
          <CardDescription>
            Modify the details for subtask:{" "}
            <span className="font-medium">
              {subtask?.title || "Loading..."}
            </span>
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
              <AlertTitle>Error Loading Data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form Display */}
          {!loading && !error && subtask && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
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
                            <SelectItem
                              key={member.UserId}
                              value={member.UserId}
                            >
                              {member.firstname} {member.lastname} (
                              {member.email})
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

                {/* Read-only submission details if completed */}
                {subtask.status === "Completed" && (
                  <div className="pt-4 border-t space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Submission Details (Read-Only)
                    </h3>
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs">
                        <Github className="w-3.5 h-3.5 mr-1.5" />
                        GitHub URL
                      </Label>
                      <Input
                        value={subtask.gitHubUrl || "N/A"}
                        readOnly
                        className="bg-muted/50 text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs">
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        Context
                      </Label>
                      <Textarea
                        value={subtask.context || "N/A"}
                        readOnly
                        rows={3}
                        className="bg-muted/50 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <CardFooter className="flex justify-end space-x-3 pt-6 px-0 pb-0 mt-4 border-t">
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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
