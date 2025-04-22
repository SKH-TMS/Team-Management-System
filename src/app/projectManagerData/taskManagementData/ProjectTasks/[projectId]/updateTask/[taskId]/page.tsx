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
          `/api/projectManagerData/taskManagementData/getTaskDetails/${taskId}`,
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

      const response = await fetch(
        "/api/projectManagerData/taskManagementData/updateTask",
        {
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
        }
      );

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
    <div className="container mx-auto py-6 px-4 md:px-6">
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
              Tasks
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Update Task</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardEdit className="h-5 w-5" />
            Update Task
          </CardTitle>
          <CardDescription>
            Make changes to your task details here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading task details...</p>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Task Title
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title" {...field} />
                      </FormControl>
                      <FormDescription>
                        Give your task a clear and descriptive title.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Task Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter task description"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description of what needs to be done.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Assign To
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Members</SelectItem>
                          {membersData.map((member) => (
                            <SelectItem
                              key={member.UserId}
                              value={member.UserId}
                            >
                              {member.firstname} {member.lastname} -{" "}
                              {member.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a team member to assign this task to.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Deadline
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="deadlineDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name="hour"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Hour
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
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
                                  >
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
                            <FormLabel>Minute</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Minute" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {["00", "15", "30", "45"].map((m) => (
                                  <SelectItem key={m} value={m}>
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
                              defaultValue={field.value}
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

                {task?.submittedby && task.submittedby !== "Not-submitted" && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">
                        Submission Details
                      </h3>

                      <FormField
                        control={form.control}
                        name="gitHubUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Github className="h-4 w-4" />
                              GitHub URL
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="GitHub repository URL"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="context"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Explanation
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Task explanation"
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
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
                          <FormLabel className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Feedback
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide feedback"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={submitting}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
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
