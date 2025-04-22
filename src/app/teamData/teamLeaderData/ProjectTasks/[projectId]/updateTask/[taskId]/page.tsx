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
  Users,
  FileText,
  Github,
  MessageSquare,
  AlertCircle,
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

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

interface Task {
  TaskId: string;
  title: string;
  description: string;
  assignedTo: string[];
  deadline: string;
  status: string;
  gitHubUrl?: string;
  context?: string;
  submittedby?: string;
}

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Task title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Task description must be at least 10 characters.",
  }),
  assignedTo: z.string().optional(),
  deadlineDate: z.string().min(1, {
    message: "Please select a deadline date.",
  }),
  hour: z.string(),
  minute: z.string(),
  ampm: z.string(),
  gitHubUrl: z.string().optional(),
  context: z.string().optional(),
});

export default function UpdateTaskPage() {
  const { projectId, taskId } = useParams();
  const router = useRouter();
  const [membersData, setMembersData] = useState<Member[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      assignedTo: "",
      deadlineDate: "",
      hour: "12",
      minute: "00",
      ampm: "AM",
      gitHubUrl: "",
      context: "",
    },
  });

  function convertUTCtoLocalParts(utcDate: string) {
    const date = new Date(utcDate);

    const formattedDate = date.toISOString().split("T")[0];
    const hour = date.getHours();
    const minute = date.getMinutes();
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;

    const hourFormatted = hour12 < 10 ? `0${hour12}` : `${hour12}`;
    const minuteFormatted = minute < 10 ? `0${minute}` : `${minute}`;

    return {
      formattedDate,
      hourFormatted,
      minuteFormatted,
      ampm,
    };
  }

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/teamData/teamLeaderData/getTaskDetails/${taskId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          }
        );
        const data = await response.json();

        if (data.success) {
          setMembersData(data.members);
          setTask(data.task);

          const { formattedDate, hourFormatted, minuteFormatted, ampm } =
            convertUTCtoLocalParts(data.task.deadline);

          form.reset({
            title: data.task.title,
            description: data.task.description,
            assignedTo: data.task.assignedTo[0] || "",
            deadlineDate: formattedDate,
            hour: hourFormatted,
            minute: minuteFormatted,
            ampm: ampm,
            gitHubUrl: data.task.gitHubUrl || "",
            context: data.task.context || "",
          });
        } else {
          setError(data.message || "Failed to fetch task details.");
          toast.error(data.message || "Failed to fetch task details.");
          router.back();
        }
      } catch (err) {
        console.error("Error fetching task:", err);
        setError("Failed to fetch task details. Please try again later.");
        toast.error("Failed to fetch task details. Please try again later.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTask();
    }
  }, [taskId, projectId, form, router]);

  const getFormattedTime = (hour: string, minute: string, ampm: string) => {
    let hourNum = Number.parseInt(hour);
    if (ampm === "PM" && hourNum !== 12) {
      hourNum += 12;
    }
    if (ampm === "AM" && hourNum === 12) {
      hourNum = 0;
    }
    return `${hourNum.toString().padStart(2, "0")}:${minute}:00`;
  };

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

      const response = await fetch("/api/teamData/teamLeaderData/updateTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: taskId,
          title: values.title,
          description: values.description,
          assignedTo: values.assignedTo ? [values.assignedTo] : [],
          deadline: combinedDeadline.toISOString(),
          gitHubUrl: values.gitHubUrl,
          context: values.context,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Task updated successfully!");
        router.back();
      } else {
        setError(data.message || "Failed to update task.");
        toast.error(data.message || "Failed to update task.");
      }
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task. Please try again.");
      toast.error("Failed to update task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-4 md:px-6">
      <Breadcrumb className="mb-4 sm:mb-6 overflow-x-auto pb-1 text-sm">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/teamData/teamLeaderData/ShowTeams">
              Teams
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/teamData/teamLeaderData/ProjectTasks/${projectId}`}
            >
              Tasks
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Update Task</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="max-w-full sm:max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <ClipboardEdit className="h-4 w-4 sm:h-5 sm:w-5" />
            Update Task
          </CardTitle>
          <CardDescription className="text-sm">
            Make changes to your task details here.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {error && (
            <Alert variant="destructive" className="mb-4 sm:mb-6 text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8">
              <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 animate-spin text-primary mb-3 sm:mb-4" />
              <p className="text-muted-foreground text-sm">
                Loading task details...
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 sm:space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm">
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Task Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter task title"
                          {...field}
                          className="h-9 sm:h-10 text-sm sm:text-base"
                        />
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">
                        Give your task a clear and descriptive title.
                      </FormDescription>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm">
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Task Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter task description"
                          className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">
                        Provide a detailed description of what needs to be done.
                      </FormDescription>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm">
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Assign To
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem
                            value="all"
                            className="text-sm sm:text-base"
                          >
                            All Members
                          </SelectItem>
                          {membersData.map((member) => (
                            <SelectItem
                              key={member.UserId}
                              value={member.UserId}
                              className="text-sm sm:text-base"
                            >
                              {member.firstname} {member.lastname}
                              <span className="hidden sm:inline">
                                {" "}
                                - {member.email}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs sm:text-sm">
                        Select a team member to assign this task to.
                      </FormDescription>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Deadline
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="deadlineDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              className="h-9 sm:h-10 text-sm sm:text-base px-3 py-2"
                              // Make date input work better on mobile
                              onClick={(e) => {
                                // Force focus to help with mobile date pickers
                                const input = e.currentTarget;
                                input.showPicker && input.showPicker();
                              }}
                            />
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name="hour"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 sm:gap-2 text-sm">
                              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Hour
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                                  <SelectValue placeholder="Hour" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from(
                                  { length: 12 },
                                  (_, i) => i + 1
                                ).map((h) => (
                                  <SelectItem
                                    key={h}
                                    value={h.toString().padStart(2, "0")}
                                    className="text-sm sm:text-base"
                                  >
                                    {h}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="minute"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Minute</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                                  <SelectValue placeholder="Minute" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {["00", "15", "30", "45"].map((m) => (
                                  <SelectItem
                                    key={m}
                                    value={m}
                                    className="text-sm sm:text-base"
                                  >
                                    {m}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ampm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">AM/PM</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                                  <SelectValue placeholder="AM/PM" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem
                                  value="AM"
                                  className="text-sm sm:text-base"
                                >
                                  AM
                                </SelectItem>
                                <SelectItem
                                  value="PM"
                                  className="text-sm sm:text-base"
                                >
                                  PM
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {task?.submittedby && task.submittedby !== "Not-submitted" && (
                  <>
                    <Separator />
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-sm font-medium">
                        Submission Details
                      </h3>

                      <FormField
                        control={form.control}
                        name="gitHubUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm">
                              <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              GitHub URL
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="GitHub repository URL"
                                {...field}
                                className="h-9 sm:h-10 text-sm sm:text-base"
                              />
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="context"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm">
                              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Explanation
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Task explanation"
                                className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {task?.status === "Re Assigned" && (
                  <>
                    <Separator />
                    <FormField
                      control={form.control}
                      name="context"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Feedback
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide feedback"
                              className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={submitting}
                    className="h-9 sm:h-10 text-sm sm:text-base w-full sm:w-auto"
                  >
                    <ArrowLeft className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-9 sm:h-10 text-sm sm:text-base w-full sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Update Task
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
