"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Users,
  Briefcase,
  ClipboardList,
  Info, // Added icons
} from "lucide-react";

// --- Define Types ---
interface TeamInfo {
  teamId: string;
  teamName: string;
}
interface ProjectInfo {
  ProjectId: string;
  title: string;
}
interface ParentTaskInfo {
  TaskId: string;
  title: string;
}
interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
}
// --- End Types ---

// --- Zod Schema ---
const quickSubtaskFormSchema = z.object({
  title: z.string().trim().min(3, { message: "Title required (min 3 chars)." }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description required (min 10 chars)." }),
  assignedTo: z
    .array(z.string())
    .min(1, { message: "Assignee required (select at least one)." }), // Array for multi-select
  deadlineDate: z.string().min(1, { message: "Deadline date required." }),
  hour: z.string(),
  minute: z.string(),
  ampm: z.string(),
});
// --- End Zod Schema ---

export default function QuickCreateSubtaskPage() {
  const router = useRouter();

  // Selection State
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [parentTasks, setParentTasks] = useState<ParentTaskInfo[]>([]);
  const [selectedParentTaskId, setSelectedParentTaskId] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<Member[]>([]); // Members of selected team

  // Loading/Error State
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(""); // General error for fetching selects

  // Form Setup
  const form = useForm<z.infer<typeof quickSubtaskFormSchema>>({
    resolver: zodResolver(quickSubtaskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      assignedTo: [],
      deadlineDate: "",
      hour: "17",
      minute: "00",
      ampm: "PM",
    },
  });

  // --- Data Fetching Callbacks ---
  const fetchLedTeams = useCallback(async () => {
    setLoadingTeams(true);
    setError("");
    try {
      const res = await fetch(`/api/teamData/teamLeaderData/getLedTeams`);
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to fetch teams.");
      setTeams(data.teams || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  const fetchProjectsForTeam = useCallback(async (teamId: string) => {
    if (!teamId) return;
    setLoadingProjects(true);
    setError("");
    setProjects([]);
    setSelectedProjectId("");
    setParentTasks([]);
    setSelectedParentTaskId("");
    setTeamMembers([]);
    try {
      const res = await fetch(
        `/api/teamData/teamLeaderData/getAssignedProjectsForTeam`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to fetch projects.");
      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchTasksForAssignment = useCallback(
    async (teamId: string, projectId: string) => {
      if (!teamId || !projectId) return;
      setLoadingTasks(true);
      setError("");
      setParentTasks([]);
      setSelectedParentTaskId("");
      try {
        const res = await fetch(
          `/api/teamData/teamLeaderData/getTasksForAssignment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId, projectId }),
          }
        );
        const data = await res.json();
        if (!res.ok || !data.success)
          throw new Error(data.message || "Failed to fetch tasks.");
        setParentTasks(data.tasks || []);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoadingTasks(false);
      }
    },
    []
  );

  const fetchTeamMembers = useCallback(async (teamId: string) => {
    if (!teamId) return;
    setLoadingMembers(true);
    setError("");
    setTeamMembers([]);
    try {
      const res = await fetch(
        `/api/teamData/teamLeaderData/getTeamMembers/${teamId}`
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to fetch team members.");
      setTeamMembers(data.members || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  // --- Effects for Dependent Fetching ---
  useEffect(() => {
    fetchLedTeams();
  }, [fetchLedTeams]);

  useEffect(() => {
    // Reset downstream selections when team changes
    setSelectedProjectId("");
    setSelectedParentTaskId("");
    setProjects([]);
    setParentTasks([]);
    setTeamMembers([]);
    form.reset({ ...form.getValues(), assignedTo: [] }); // Reset assignees in form

    if (selectedTeamId) {
      fetchProjectsForTeam(selectedTeamId);
      fetchTeamMembers(selectedTeamId);
    }
  }, [selectedTeamId, fetchProjectsForTeam, fetchTeamMembers, form]); // Added form to dependency array

  useEffect(() => {
    // Reset downstream selection when project changes
    setSelectedParentTaskId("");
    setParentTasks([]);

    if (selectedProjectId && selectedTeamId) {
      fetchTasksForAssignment(selectedTeamId, selectedProjectId);
    }
  }, [selectedProjectId, selectedTeamId, fetchTasksForAssignment]);

  // --- Form Submission ---
  const getFormattedTime = (hour: string, minute: string, ampm: string) => {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minute}:00`;
  };

  const onSubmit = async (values: z.infer<typeof quickSubtaskFormSchema>) => {
    if (!selectedParentTaskId) {
      toast.error("Please select a parent task first.");
      return;
    }
    setSubmitting(true);
    setError(""); // Clear general error on submit attempt
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

    // Determine the value to send for assignedTo
    const assignedToValue = values.assignedTo.includes("__all__")
      ? "__all__"
      : values.assignedTo;

    try {
      const response = await fetch(
        `/api/teamData/teamLeaderData/createSubTask`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentTaskId: selectedParentTaskId,
            title: values.title,
            description: values.description,
            assignedTo: assignedToValue, // Send "__all__" or array of IDs
            deadline: combinedDeadline.toISOString(),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "Failed to create subtask(s).");

      toast.success(data.message || "Subtask(s) created successfully!");
      form.reset(); // Reset form after successful submission
      // Keep team/project/task selected to allow creating more subtasks quickly
      // Or navigate back: router.push(`/teamData/teamLeaderData/SubTasks/${selectedParentTaskId}`);
    } catch (err: any) {
      console.error("Error creating subtask:", err);
      setError(
        err.message ||
          "Failed to create subtask(s). Please check details and try again."
      );
      toast.error(err.message || "Failed to create subtask(s).");
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
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6" /> Quick Create
            Subtask
          </CardTitle>
          <CardDescription>
            Select the context and then fill in the subtask details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* General Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Selection Section */}
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <h3 className="text-lg font-medium mb-3">Context Selection</h3>
            {/* Team Select */}
            <div className="space-y-1.5">
              <Label className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Team*
              </Label>
              {loadingTeams ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedTeamId}
                  onValueChange={setSelectedTeamId}
                  disabled={loadingTeams}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No teams found
                      </div>
                    )}
                    {teams.map((team) => (
                      <SelectItem key={team.teamId} value={team.teamId}>
                        {team.teamName}----({team.teamId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {/* Project Select */}
            <div className="space-y-1.5">
              <Label className="font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Select Project*
              </Label>
              {loadingProjects ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                  disabled={!selectedTeamId || loadingProjects}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No projects for this team
                      </div>
                    )}
                    {projects.map((proj) => (
                      <SelectItem key={proj.ProjectId} value={proj.ProjectId}>
                        {proj.title}----({proj.ProjectId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!selectedTeamId && (
                <p className="text-xs text-muted-foreground italic">
                  Select a team first.
                </p>
              )}
            </div>
            {/* Parent Task Select */}
            <div className="space-y-1.5">
              <Label className="font-medium flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Select Parent Task*
              </Label>
              {loadingTasks ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedParentTaskId}
                  onValueChange={setSelectedParentTaskId}
                  disabled={!selectedProjectId || loadingTasks}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a parent task..." />
                  </SelectTrigger>
                  <SelectContent>
                    {parentTasks.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No tasks for this assignment
                      </div>
                    )}
                    {parentTasks.map((task) => (
                      <SelectItem key={task.TaskId} value={task.TaskId}>
                        {task.title}----({task.TaskId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!selectedProjectId && (
                <p className="text-xs text-muted-foreground italic">
                  Select a project first.
                </p>
              )}
            </div>
          </div>

          {/* Subtask Form (Conditional) */}
          {selectedParentTaskId && (
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">
                New Subtask Details
              </h3>
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
                        <FormLabel className="font-medium">
                          Subtask Title*
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
                        <FormLabel className="font-medium">
                          Subtask Description*
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
                  {/* Assignee Checkboxes */}
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={() => (
                      <FormItem>
                        <FormLabel className="font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" /> Assign To*
                        </FormLabel>
                        {loadingMembers ? (
                          <Skeleton className="h-24 w-full" />
                        ) : (
                          <ScrollArea className="h-40 w-full rounded-md border p-3">
                            <div className="space-y-2">
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={
                                      form.getValues("assignedTo").length ===
                                        1 &&
                                      form.getValues("assignedTo")[0] ===
                                        "__all__"
                                    }
                                    onCheckedChange={(checked) => {
                                      form.setValue(
                                        "assignedTo",
                                        checked ? ["__all__"] : [],
                                        { shouldValidate: true }
                                      );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-medium cursor-pointer text-primary">
                                  Assign to All Team Members
                                </FormLabel>
                              </FormItem>
                              <Separator className="my-2" />
                              {teamMembers.length === 0 && (
                                <p className="text-sm text-muted-foreground italic">
                                  No team members found.
                                </p>
                              )}
                              {teamMembers.map((member) => (
                                <FormField
                                  key={member.UserId}
                                  control={form.control}
                                  name="assignedTo"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            member.UserId
                                          )}
                                          disabled={field.value?.includes(
                                            "__all__"
                                          )} // Disable if "All" is checked
                                          onCheckedChange={(checked) => {
                                            const currentValues =
                                              field.value?.filter(
                                                (id) => id !== "__all__"
                                              ) || [];
                                            return checked
                                              ? field.onChange([
                                                  ...currentValues,
                                                  member.UserId,
                                                ])
                                              : field.onChange(
                                                  currentValues.filter(
                                                    (id) => id !== member.UserId
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer">
                                        {member.firstname} {member.lastname} (
                                        {member.email})
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                        <FormDescription>
                          Select one or more team members, or choose 'Assign
                          All'.
                        </FormDescription>
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
                  {/* Submit Button */}
                  <CardFooter className="flex justify-end pt-6 px-0 pb-0 mt-4 border-t">
                    <Button
                      type="submit"
                      disabled={
                        submitting ||
                        loadingTeams ||
                        loadingProjects ||
                        loadingTasks ||
                        loadingMembers
                      }
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
