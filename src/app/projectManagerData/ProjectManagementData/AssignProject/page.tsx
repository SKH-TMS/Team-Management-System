"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ITeam } from "@/models/Team";
import { IProject } from "@/models/Project";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import {
  Briefcase,
  ClipboardList,
  Users,
  Calendar,
  Clock,
  Check as CheckIcon,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AssignProject() {
  const router = useRouter();

  const [teams, setTeams] = useState<ITeam[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<ITeam | null>(null);
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null);
  const [teamQuery, setTeamQuery] = useState("");
  const [teamListOpen, setTeamListOpen] = useState(false);
  const [projectQuery, setProjectQuery] = useState("");
  const [projectListOpen, setProjectListOpen] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/projectManagerData/teamManagementData/getTeams")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTeams(d.teams);
        else throw new Error(d.message);
      })
      .catch((e) => {
        console.error(e);
        toast.error("Failed to fetch teams.");
        router.push("/userData/LoginUser");
      });

    fetch("/api/projectManagerData/projectManagementData/getUnassignedProjects")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProjects(d.projects);
        else throw new Error(d.message);
      })
      .catch((e) => {
        console.error(e);
        toast.error("Failed to fetch projects.");
      });
  }, [router]);

  const getFormattedTime = () => {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${minute}:00`;
  };

  const handleAssign = async () => {
    if (!selectedTeam || !selectedProject || !deadlineDate) {
      toast.error("Please select project, team & deadline.");
      return;
    }
    setLoading(true);
    setError("");
    const combined = new Date(`${deadlineDate}T${getFormattedTime()}`);
    if (isNaN(combined.getTime())) {
      toast.error("Invalid date/time.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/projectManagerData/projectManagementData/assignProject/${selectedProject.ProjectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: selectedTeam.teamId,
            deadline: combined.toISOString(),
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Project assigned!");
        router.back();
      } else {
        throw new Error(data.message);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Assignment failed.");
      toast.error(e.message || "Assignment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5" />
            Assign Project
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <Label className="flex items-center">
              <ClipboardList className="mr-2 h-4 w-4" />
              Select Project
            </Label>
            <div className="relative">
              <Input
                placeholder="Search and select a project"
                value={selectedProject?.title ?? projectQuery}
                onChange={(e) => {
                  setProjectQuery(e.target.value);
                  setSelectedProject(null);
                  setProjectListOpen(true);
                }}
                onFocus={() => setProjectListOpen(true)}
                onBlur={() => setTimeout(() => setProjectListOpen(false), 150)}
                autoComplete="off"
              />
              {projectListOpen && (
                <ul
                  className="absolute z-10 mt-1 w-full bg-white rounded-md 
                             border border-gray-200 shadow-lg max-h-60 
                             overflow-auto"
                >
                  {projects
                    .filter((p) =>
                      p.title.toLowerCase().includes(projectQuery.toLowerCase())
                    )
                    .map((p) => (
                      <li
                        key={p.ProjectId}
                        className={cn(
                          "flex items-center px-3 py-2 cursor-pointer",
                          selectedProject?.ProjectId === p.ProjectId
                            ? "bg-gray-100"
                            : "hover:bg-gray-50"
                        )}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedProject(p);
                          setProjectQuery(p.title);
                          setProjectListOpen(false);
                        }}
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedProject?.ProjectId === p.ProjectId
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {p.title}
                      </li>
                    ))}
                  {projects.filter((p) =>
                    p.title.toLowerCase().includes(projectQuery.toLowerCase())
                  ).length === 0 && (
                    <li className="px-3 py-2 text-sm text-gray-500">
                      No projects found.
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Select Team
            </Label>
            <div className="relative">
              <Input
                placeholder="Search and select a team"
                value={selectedTeam?.teamName ?? teamQuery}
                onChange={(e) => {
                  setTeamQuery(e.target.value);
                  setSelectedTeam(null);
                  setTeamListOpen(true);
                }}
                onFocus={() => setTeamListOpen(true)}
                onBlur={() => setTimeout(() => setTeamListOpen(false), 150)}
                autoComplete="off"
              />
              {teamListOpen && (
                <ul
                  className="absolute z-10 mt-1 w-full bg-white rounded-md 
                             border border-gray-200 shadow-lg max-h-60 
                             overflow-auto"
                >
                  {teams
                    .filter((t) =>
                      t.teamName.toLowerCase().includes(teamQuery.toLowerCase())
                    )
                    .map((t) => (
                      <li
                        key={t.teamId}
                        className={cn(
                          "flex items-center px-3 py-2 cursor-pointer",
                          selectedTeam?.teamId === t.teamId
                            ? "bg-gray-100"
                            : "hover:bg-gray-50"
                        )}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedTeam(t);
                          setTeamQuery(t.teamName);
                          setTeamListOpen(false);
                        }}
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTeam?.teamId === t.teamId
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {t.teamName}
                      </li>
                    ))}
                  {teams.filter((t) =>
                    t.teamName.toLowerCase().includes(teamQuery.toLowerCase())
                  ).length === 0 && (
                    <li className="px-3 py-2 text-sm text-gray-500">
                      No teams found.
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {selectedProject && selectedTeam && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Deadline Date
                </Label>
                <Input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Deadline Time
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select onValueChange={setHour} defaultValue={hour}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <SelectItem
                          key={h}
                          value={h.toString().padStart(2, "0")}
                        >
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={setMinute} defaultValue={minute}>
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {["00", "15", "30", "45"].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={setAmPm} defaultValue={ampm}>
                    <SelectTrigger>
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
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button onClick={handleAssign} disabled={loading} className="w-full">
            {loading ? "Assigning…" : "Assign Project"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
