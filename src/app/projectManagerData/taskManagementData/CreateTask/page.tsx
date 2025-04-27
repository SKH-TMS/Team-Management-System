"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Users,
  Briefcase,
  Calendar,
  Clock,
  PlusCircle,
  Search as SearchIcon,
  XCircle,
  Loader2,
  Info, // Added for info alert
} from "lucide-react";
// Removed cn as it wasn't used

// Interface for Team data (adjust if needed based on API response)
interface Team {
  teamId: string;
  teamName: string;
  // members?: any[]; // We might not need members here anymore
}

// Interface for Project data (adjust if needed based on API response)
interface Project {
  ProjectId: string;
  title: string;
}

// Removed Member interface as it's no longer used for assignment here

export default function CreateTaskPage() {
  // Renamed component for clarity
  const router = useRouter();

  const [loading, setLoading] = useState(true); // Combined loading state
  const [isSubmitting, setIsSubmitting] = useState(false); // Separate state for submission loading
  const [errorMessage, setErrorMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Keep auth check

  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  // const [membersData, setMembersData] = useState<any[]>([]); // Removed membersData state

  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // State for custom dropdowns/search inputs
  const [teamQuery, setTeamQuery] = useState("");
  const [teamListOpen, setTeamListOpen] = useState(false);
  const [projectQuery, setProjectQuery] = useState("");
  const [projectListOpen, setProjectListOpen] = useState(false);

  // Task details state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // const [assignedTo, setAssignedTo] = useState<string>(""); // Removed assignedTo state

  // Deadline state
  const [deadlineDate, setDeadlineDate] = useState("");
  const [hour, setHour] = useState("17"); // Default to 5 PM
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState<"AM" | "PM">("PM"); // Default to PM

  // Time constants
  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = ["00", "15", "30", "45"];

  // Helper to format time for backend
  function getFormattedTime(): string {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12; // Convert PM hours (except 12 PM)
    if (ampm === "AM" && h === 12) h = 0; // Convert 12 AM to 00
    return `${h.toString().padStart(2, "0")}:${minute}:00`;
  }

  // Fetch initial data (Teams)
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await fetch(
          "/api/projectManagerData/taskManagementData/getTeams" // API to fetch teams PM manages or can assign to
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch teams");
        }
        setTeams(data.teams || []);
        // setMembersData(data.membersData); // Removed: No longer setting membersData
        setIsAuthenticated(true); // Assume success means authenticated for this page's purpose
      } catch (e: any) {
        console.error("Error fetching teams:", e);
        const message = e.message || "Failed to load initial data.";
        setErrorMessage(message);
        toast.error(message);
        // Optional: Redirect if auth fails fundamentally
        // if (e.message.includes("Unauthorized") || e.message.includes("Forbidden")) {
        //   router.push("/login"); // Or appropriate page
        // }
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []); // Removed router dependency unless needed for auth redirect

  // Fetch Projects when a Team is selected
  useEffect(() => {
    if (!selectedTeamId) {
      setProjects([]); // Clear projects if team is deselected
      setSelectedProjectId(""); // Clear selected project ID
      return;
    }

    async function loadProjectsForTeam() {
      // Consider adding a loading state specific to projects
      try {
        const res = await fetch(
          "/api/projectManagerData/taskManagementData/getProjects", // API should return projects *assigned* to this team
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId: selectedTeamId }),
          }
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch projects for team");
        }
        setProjects(data.projects || []);
      } catch (e: any) {
        console.error("Error fetching projects:", e);
        toast.error(
          e.message || "Failed to fetch projects for the selected team."
        );
        setProjects([]); // Clear projects on error
      } finally {
        // Stop project-specific loading state if you add one
      }
    }
    loadProjectsForTeam();
  }, [selectedTeamId]); // Removed router dependency

  // Handle Task Creation/Assignment
  async function handleTaskAssign() {
    // Validation
    if (!selectedTeamId) return toast.error("Please select a team.");
    if (!selectedProjectId) return toast.error("Please select a project.");
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
      // Optional: Check if deadline is in the past
      if (combinedDeadline < new Date()) {
        toast.error("Deadline cannot be in the past.");
        return;
      }
    } catch (e: any) {
      return toast.error(e.message || "Invalid deadline format.");
    }

    setIsSubmitting(true); // Start submission loading state
    setErrorMessage("");

    try {
      // API endpoint needs to handle task creation AND linking to AssignedProjectLog
      // The endpoint name 'assignTask' might be slightly misleading now, maybe 'createAndAssignTask'?
      // We pass projectId in the URL and teamId in the body for this example.
      const res = await fetch(
        `/api/projectManagerData/taskManagementData/createTask/${selectedProjectId}`, // Changed endpoint name suggestion
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            // assignedTo: undefined, // REMOVED: No longer sending assignedTo
            teamId: selectedTeamId,
            //projectId: selectedProjectId, // Send projectId in body as well
            deadline: combinedDeadline.toISOString(), // Send full ISO string
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create task");
      }

      toast.success("Task created successfully!");
      router.push("/projectManagerData/taskManagementData/ManageTasks"); // Navigate to task list on success
      // Or router.back(); if preferred
    } catch (e: any) {
      console.error("Error creating task:", e);
      const message = e.message || "Failed to create task.";
      setErrorMessage(message); // Show error message near the form
      toast.error(message);
      // Don't redirect automatically on creation failure, let user retry/fix
      // router.push("/projectManagerData/ProfileProjectManager");
    } finally {
      setIsSubmitting(false); // Stop submission loading state
    }
  }

  // --- Render Logic ---

  if (loading && !isAuthenticated) {
    // Show skeleton only during initial load
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
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

  // Handle case where initial data load failed but wasn't an auth issue
  if (!loading && !isAuthenticated && errorMessage) {
    return (
      <div className="container mx-auto py-6 px-4 text-center">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        {/* Optional: Add a retry button */}
      </div>
    );
  }

  // If authenticated but loading failed specifically for teams
  if (!loading && teams.length === 0 && errorMessage) {
    return (
      <div className="container mx-auto py-6 px-4 text-center">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Teams</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get names for display in input fields after selection
  const selectedTeamName =
    teams.find((t) => t.teamId === selectedTeamId)?.teamName || "";
  const selectedProjectTitle =
    projects.find((p) => p.ProjectId === selectedProjectId)?.title || "";

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="max-w-2xl mx-auto">
        {" "}
        {/* Increased max-width */}
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            {" "}
            {/* Adjusted size */}
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Task
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Team Selection */}
          <div className="space-y-1">
            <Label
              htmlFor="team-search"
              className="flex items-center font-medium"
            >
              <Users className="mr-2 h-4 w-4 text-primary" />
              Select Team*
            </Label>
            <div className="relative">
              <Input
                id="team-search"
                placeholder="Search and select team..."
                value={selectedTeamId ? selectedTeamName : teamQuery}
                onChange={(e) => {
                  setTeamQuery(e.target.value);
                  setSelectedTeamId(""); // Clear selection when typing
                  setSelectedProjectId(""); // Also clear project
                  setProjects([]); // Clear projects list
                  setTeamListOpen(true);
                }}
                onFocus={() => setTeamListOpen(true)}
                // Use onMouseDown for list items to prevent blur before click registers
                onBlur={() => setTimeout(() => setTeamListOpen(false), 150)} // Delay blur to allow click
                autoComplete="off"
                className="w-full pl-8" // Padding for icon
              />
              <SearchIcon className="absolute top-1/2 left-2.5 h-4 w-4 text-muted-foreground -translate-y-1/2" />
              {teamListOpen && (
                <ul className="absolute z-20 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto text-sm">
                  {teams.length === 0 && !loading && (
                    <li className="px-3 py-2 text-muted-foreground italic">
                      No teams available.
                    </li>
                  )}
                  {teams
                    .filter((t) =>
                      t.teamName.toLowerCase().includes(teamQuery.toLowerCase())
                    )
                    .map((t) => (
                      <li
                        key={t.teamId}
                        className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                        // Use onMouseDown to handle selection before blur closes the list
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent input blur
                          setSelectedTeamId(t.teamId);
                          setTeamQuery(""); // Clear search query
                          setTeamListOpen(false); // Close list
                        }}
                      >
                        {t.teamName}
                      </li>
                    ))}
                  {teams.filter((t) =>
                    t.teamName.toLowerCase().includes(teamQuery.toLowerCase())
                  ).length === 0 &&
                    teamQuery && (
                      <li className="px-3 py-2 text-muted-foreground italic">
                        No teams match '{teamQuery}'.
                      </li>
                    )}
                </ul>
              )}
            </div>
          </div>

          {/* Project Selection (Conditional) */}
          {selectedTeamId && (
            <div className="space-y-1">
              <Label
                htmlFor="project-search"
                className="flex items-center font-medium"
              >
                <Briefcase className="mr-2 h-4 w-4 text-primary" />
                Select Project*
              </Label>
              <div className="relative">
                <Input
                  id="project-search"
                  placeholder="Search and select project..."
                  value={
                    selectedProjectId ? selectedProjectTitle : projectQuery
                  }
                  onChange={(e) => {
                    setProjectQuery(e.target.value);
                    setSelectedProjectId(""); // Clear selection
                    setProjectListOpen(true);
                  }}
                  onFocus={() => setProjectListOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setProjectListOpen(false), 150)
                  }
                  autoComplete="off"
                  className="w-full pl-8"
                  disabled={!selectedTeamId} // Disable if no team selected
                />
                <SearchIcon className="absolute top-1/2 left-2.5 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                {projectListOpen && (
                  <ul className="absolute z-20 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto text-sm">
                    {projects.length === 0 && (
                      <li className="px-3 py-2 text-muted-foreground italic">
                        No projects assigned to this team or loading...
                      </li>
                    )}
                    {projects
                      .filter((p) =>
                        p.title
                          .toLowerCase()
                          .includes(projectQuery.toLowerCase())
                      )
                      .map((p) => (
                        <li
                          key={p.ProjectId}
                          className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedProjectId(p.ProjectId);
                            setProjectQuery("");
                            setProjectListOpen(false);
                          }}
                        >
                          {p.title} ({p.ProjectId}) {/* Show ID for clarity? */}
                        </li>
                      ))}
                    {projects.filter((p) =>
                      p.title.toLowerCase().includes(projectQuery.toLowerCase())
                    ).length === 0 &&
                      projectQuery && (
                        <li className="px-3 py-2 text-muted-foreground italic">
                          No projects match '{projectQuery}'.
                        </li>
                      )}
                  </ul>
                )}
              </div>
              {!selectedTeamId && (
                <p className="text-xs text-muted-foreground italic mt-1">
                  Select a team first to see available projects.
                </p>
              )}
            </div>
          )}

          {/* Task Details (Conditional) */}
          {selectedTeamId && selectedProjectId && (
            <>
              <div className="space-y-1 pt-4 border-t">
                {" "}
                {/* Add separator */}
                <Label
                  htmlFor="title"
                  className="flex items-center font-medium"
                >
                  {/* <PlusCircle className="mr-2 h-4 w-4" /> */}
                  Task Title*
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a concise task title"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="desc" className="flex items-center font-medium">
                  {/* <PlusCircle className="mr-2 h-4 w-4" /> */}
                  Task Description*
                </Label>
                <Textarea
                  id="desc"
                  rows={4} // Increased rows
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed instructions for the task..."
                  required
                />
              </div>

              {/* REMOVED "Assign To" Select Dropdown */}
              <Alert
                variant="default"
                className="bg-blue-50 border-blue-200 text-blue-800"
              >
                <Info className="h-4 w-4 !text-blue-800" />
                <AlertTitle className="font-medium">Assignment Note</AlertTitle>
                <AlertDescription className="text-xs">
                  This task will be assigned to the selected Team (
                  {selectedTeamName || "N/A"}). The Team Leader can then create
                  and assign specific subtasks to individual members.
                </AlertDescription>
              </Alert>

              {/* Deadline Section */}
              <div className="space-y-1 pt-4 border-t">
                {" "}
                {/* Add separator */}
                <Label className="flex items-center font-medium mb-1">
                  <Calendar className="mr-2 h-4 w-4 text-primary" />
                  Deadline*
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                  <div className="sm:col-span-2">
                    <Label
                      htmlFor="date"
                      className="text-xs font-normal sr-only"
                    >
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
                      <Label
                        htmlFor="hour"
                        className="text-xs font-normal sr-only"
                      >
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
                      <Label
                        htmlFor="ampm"
                        className="text-xs font-normal sr-only"
                      >
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
            </>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
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
            onClick={handleTaskAssign}
            disabled={
              isSubmitting ||
              !selectedTeamId ||
              !selectedProjectId ||
              !title ||
              !description ||
              !deadlineDate
            } // Disable if required fields missing or submitting
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Task...
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
