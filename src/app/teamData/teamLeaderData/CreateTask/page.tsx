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
  Users,
  Briefcase,
  Calendar,
  Clock,
  PlusCircle,
  Search as SearchIcon,
  XCircle,
  Loader2,
} from "lucide-react";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
}

export default function ManageTeam() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [teams, setTeams] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [membersData, setMembersData] = useState<any[]>([]);

  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [teamQuery, setTeamQuery] = useState("");
  const [teamListOpen, setTeamListOpen] = useState(false);

  const [projectQuery, setProjectQuery] = useState("");
  const [projectListOpen, setProjectListOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("__none");

  const [deadlineDate, setDeadlineDate] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState<"AM" | "PM">("AM");

  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = ["00", "15", "30", "45"];

  function getFormattedTime() {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${minute}:00`;
  }

  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await fetch("/api/teamData/teamLeaderData/getTeams");
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setTeams(data.teams);
        setMembersData(data.membersData);
        setIsAuthenticated(true);
      } catch (e: any) {
        console.error(e);
        setErrorMessage(e.message || "Failed to fetch teams");
        toast.error(e.message || "Failed to fetch teams");
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadTeams();
  }, [router]);

  useEffect(() => {
    if (!selectedTeamId) return;
    async function loadProjects() {
      try {
        const res = await fetch("/api/teamData/teamLeaderData/getProjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId: selectedTeamId }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setProjects(data.projects);
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Failed to fetch projects");
        router.push("/teamData/ProfileProjectManager");
      }
    }
    loadProjects();
  }, [selectedTeamId, router]);

  async function handleTaskAssign() {
    if (!selectedTeamId || !selectedProjectId || !deadlineDate) {
      return toast.error("Select team, project, and deadline");
    }
    setLoading(true);
    try {
      const combined = new Date(`${deadlineDate}T${getFormattedTime()}`);
      if (isNaN(combined.getTime())) throw new Error("Invalid date/time");

      const res = await fetch(
        `/api/teamData/teamLeaderData/assignTask/${selectedProjectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            assignedTo: assignedTo ? [assignedTo] : [],
            teamId: selectedTeamId,
            deadline: combined.toISOString(),
          }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Task assigned!");
      router.back();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to assign task");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 container mx-auto">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Not authenticated</AlertTitle>
          <AlertDescription>Please log in to manage tasks.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const selectedTeamName =
    teams.find((t) => t.teamId === selectedTeamId)?.teamName || "";
  const selectedProjectTitle =
    projects.find((p) => p.ProjectId === selectedProjectId)?.title || "";

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Task
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Select Team
            </Label>
            <div className="relative">
              <Input
                placeholder="Search and select a team"
                value={selectedTeamId ? selectedTeamName : teamQuery}
                onChange={(e) => {
                  setTeamQuery(e.target.value);
                  setSelectedTeamId("");
                  setTeamListOpen(true);
                }}
                onFocus={() => setTeamListOpen(true)}
                onBlur={() => setTimeout(() => setTeamListOpen(false), 150)}
                autoComplete="off"
                className="w-full pl-10"
              />
              <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 text-gray-400 -translate-y-1/2" />
              {teamListOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
                  {teams
                    .filter((t) =>
                      t.teamName.toLowerCase().includes(teamQuery.toLowerCase())
                    )
                    .map((t) => (
                      <li
                        key={t.teamId}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedTeamId(t.teamId);
                          setTeamQuery("");
                          setTeamListOpen(false);
                        }}
                      >
                        {t.teamName}
                      </li>
                    ))}
                  {teams.filter((t) =>
                    t.teamName.toLowerCase().includes(teamQuery.toLowerCase())
                  ).length === 0 && (
                    <li className="px-3 py-2 text-gray-500">No teams found.</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {selectedTeamId && (
            <div className="space-y-1">
              <Label className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4" />
                Select Project
              </Label>
              <div className="relative">
                <Input
                  placeholder="Search and select a project"
                  value={
                    selectedProjectId ? selectedProjectTitle : projectQuery
                  }
                  onChange={(e) => {
                    setProjectQuery(e.target.value);
                    setSelectedProjectId("");
                    setProjectListOpen(true);
                  }}
                  onFocus={() => setProjectListOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setProjectListOpen(false), 150)
                  }
                  autoComplete="off"
                  className="w-full pl-10"
                />
                <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 text-gray-400 -translate-y-1/2" />
                {projectListOpen && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
                    {projects
                      .filter((p) =>
                        p.title
                          .toLowerCase()
                          .includes(projectQuery.toLowerCase())
                      )
                      .map((p) => (
                        <li
                          key={p.ProjectId}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedProjectId(p.ProjectId);
                            setProjectQuery("");
                            setProjectListOpen(false);
                          }}
                        >
                          {p.title}
                        </li>
                      ))}
                    {projects.filter((p) =>
                      p.title.toLowerCase().includes(projectQuery.toLowerCase())
                    ).length === 0 && (
                      <li className="px-3 py-2 text-gray-500">
                        No projects found.
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}

          {selectedTeamId && selectedProjectId && (
            <>
              <div className="space-y-1">
                <Label htmlFor="title" className="flex items-center">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Task Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="desc" className="flex items-center">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Description
                </Label>
                <Textarea
                  id="desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="member" className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Assign To
                </Label>
                <Select
                  value={assignedTo}
                  onValueChange={(val) =>
                    setAssignedTo(val === "__none" ? "" : val)
                  }
                  defaultValue="__none"
                >
                  <SelectTrigger id="member">
                    <SelectValue placeholder="All Members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">All Members</SelectItem>
                    {membersData
                      .filter((d) => d.teamId === selectedTeamId)
                      .flatMap((d) =>
                        d.members.map((m: Member) => (
                          <SelectItem key={m.UserId} value={m.UserId}>
                            {m.firstname} {m.lastname} — {m.email}
                          </SelectItem>
                        ))
                      )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="date" className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Deadline Date
                </Label>
                <Input
                  id="date"
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
                      {hours.map((h) => (
                        <SelectItem key={h} value={h}>
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
                      {minutes.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(v) => setAmPm(v as "AM" | "PM")}
                    defaultValue={ampm}
                  >
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
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleTaskAssign} disabled={loading}>
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning…
              </span>
            ) : (
              "Assign Task"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
