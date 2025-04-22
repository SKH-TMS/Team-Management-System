"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import type { ITeam } from "@/models/Team";
import type { IProject } from "@/models/Project";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Calendar,
  Clock,
  Users,
  Briefcase,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  teamId: z.string().min(1, "Please select a team"),
  date: z.string().min(1, "Please select a deadline date"),
  hour: z.string(),
  minute: z.string(),
  ampm: z.enum(["AM", "PM"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function AssignSpecificProject() {
  const router = useRouter();
  const { projectId } = useParams();
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState("");
  const [teamQuery, setTeamQuery] = useState("");
  const [teamListOpen, setTeamListOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamId: "",
      date: "",
      hour: "12",
      minute: "00",
      ampm: "AM",
    },
  });

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          "/api/projectManagerData/teamManagementData/getTeams"
        );
        const data = await response.json();
        if (data.success) {
          setTeams(data.teams);
        } else {
          setError(data.message || "Failed to fetch teams.");
          toast.error(data.message || "Failed to fetch teams.");
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
        setError("Failed to fetch teams. Please try again.");
        toast.error("Failed to fetch teams. Please try again.");
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(
          `/api/projectManagerData/projectManagementData/getProjectForUpdation/${projectId}`
        );
        const data = await response.json();
        if (data.success) {
          setProject(data.project);
        } else {
          setError(data.message || "Failed to fetch project details.");
          toast.error(data.message || "Failed to fetch project details.");
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
        setError("Failed to fetch project details. Please try again.");
        toast.error("Failed to fetch project details. Please try again.");
      } finally {
        setFetchingData(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

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

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError("");

    try {
      const formattedTime = getFormattedTime(
        values.hour,
        values.minute,
        values.ampm
      );
      const combinedDeadline = new Date(`${values.date}T${formattedTime}`);

      if (isNaN(combinedDeadline.getTime())) {
        setError("Invalid date/time selection.");
        toast.error("Invalid date/time selection.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/projectManagerData/projectManagementData/assignProject/${projectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: values.teamId,
            deadline: combinedDeadline.toISOString(),
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Project assigned successfully!");
        router.push("/projectManagerData/ProjectManagementData/ManageProject");
      } else {
        setError(data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error assigning project:", error);
      setError("Failed to assign project. Please try again.");
      toast.error("Failed to assign project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() =>
            router.push(
              "/projectManagerData/ProjectManagementData/ManageProject"
            )
          }
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5" />
            Assign Project to Team
          </CardTitle>
          <CardDescription>
            Select a team and set a deadline for project completion
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

          {fetchingData ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Project Details */}
              {project && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                    <h2 className="text-xl font-semibold text-blue-600">
                      {project.title}
                    </h2>
                  </div>
                  <p className="text-gray-600 ml-7">{project.description}</p>
                </div>
              )}

              <Separator />
              <div className="space-y-2">
                <Label htmlFor="team-select" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Select Team
                </Label>
                <div className="relative">
                  <Input
                    id="team-select"
                    placeholder="Search and select a team"
                    value={
                      form.watch("teamId")
                        ? teams.find((t) => t.teamId === form.watch("teamId"))
                            ?.teamName || teamQuery
                        : teamQuery
                    }
                    onChange={(e) => {
                      setTeamQuery(e.target.value);
                      form.setValue("teamId", "");
                      setTeamListOpen(true);
                    }}
                    onFocus={() => setTeamListOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setTeamListOpen(false), 150);
                    }}
                    autoComplete="off"
                    className="w-full"
                  />

                  {teamListOpen && (
                    <ul
                      className="absolute z-10 w-full max-h-60 overflow-auto bg-white 
                   shadow-md rounded-md mt-1 border border-gray-200"
                    >
                      {teams
                        .filter((team) =>
                          team.teamName
                            .toLowerCase()
                            .includes(teamQuery.toLowerCase())
                        )
                        .map((team) => (
                          <li
                            key={team.teamId}
                            className="flex items-center px-3 py-2 hover:bg-gray-100 
                         cursor-pointer"
                            onMouseDown={(e) => {
                              // prevent blur
                              e.preventDefault();
                              // set form value and close
                              form.setValue("teamId", team.teamId);
                              setTeamQuery(team.teamName);
                              setTeamListOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.watch("teamId") === team.teamId
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span>{team.teamName}</span>
                          </li>
                        ))
                        .slice(0, 10)}

                      {teams.filter((t) =>
                        t.teamName
                          .toLowerCase()
                          .includes(teamQuery.toLowerCase())
                      ).length === 0 && (
                        <li className="px-3 py-2 text-sm text-gray-500">
                          No team found.
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                {form.formState.errors.teamId && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.teamId.message}
                  </p>
                )}
              </div>

              {/* Deadline Selection - Only show if team is selected */}
              {form.watch("teamId") && (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="deadline-date"
                      className="flex items-center"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Deadline Date
                    </Label>
                    <Input
                      id="deadline-date"
                      type="date"
                      {...form.register("date")}
                      className="w-full"
                    />
                    {form.formState.errors.date && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.date.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Deadline Time
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        onValueChange={(value) => form.setValue("hour", value)}
                        defaultValue={form.watch("hour")}
                      >
                        <SelectTrigger id="hour-select">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (h) => (
                              <SelectItem
                                key={h}
                                value={h.toString().padStart(2, "0")}
                              >
                                {h}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>

                      <Select
                        onValueChange={(value) =>
                          form.setValue("minute", value)
                        }
                        defaultValue={form.watch("minute")}
                      >
                        <SelectTrigger id="minute-select">
                          <SelectValue placeholder="Minute" />
                        </SelectTrigger>
                        <SelectContent>
                          {["00", "15", "30", "45"].map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        onValueChange={(value) =>
                          form.setValue("ampm", value as "AM" | "PM")
                        }
                        defaultValue={form.watch("ampm")}
                      >
                        <SelectTrigger id="ampm-select">
                          <SelectValue placeholder="AM/PM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            className="w-full"
            disabled={loading || fetchingData}
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Assigning...
              </span>
            ) : (
              <span className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Assign Project
              </span>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(
                "/projectManagerData/ProjectManagementData/ManageProject"
              )
            }
            className="w-full"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
