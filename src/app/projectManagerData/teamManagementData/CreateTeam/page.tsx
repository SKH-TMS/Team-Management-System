"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { IUser } from "@/models/User";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import {
  UserPlus,
  Users,
  Briefcase,
  Calendar,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";

export default function CreateTeam() {
  const router = useRouter();

  const [teamName, setTeamName] = useState("");
  const [users, setUsers] = useState<IUser[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<
    { email: string; userId: string }[]
  >([]);
  const [teamLeader, setTeamLeader] = useState<{
    email: string;
    userId: string;
  } | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("__none");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState<"AM" | "PM">("AM");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = ["00", "15", "30", "45"];

  function formatTime() {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${minute}:00`;
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [uRes, pRes] = await Promise.all([
          fetch("/api/projectManagerData/teamManagementData/getAllUsers"),
          fetch(
            "/api/projectManagerData/projectManagementData/getUnassignedProjects"
          ),
        ]);
        const uData = await uRes.json();
        const pData = await pRes.json();
        if (!uData.success) throw new Error(uData.message);
        if (!pData.success) throw new Error(pData.message);
        setUsers(uData.users);
        setProjects(pData.projects);
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Failed to load data");
        setError(e.message || "Failed to load data");
        if (!users.length) router.push("/userData/LoginUser");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  useEffect(() => {
    if (selectedMembers.length < 2) {
      setTeamLeader(null);
    }
  }, [selectedMembers]);

  function toggleMember(email: string, userId: string) {
    setSelectedMembers((prev) =>
      prev.some((m) => m.email === email)
        ? prev.filter((m) => m.email !== email)
        : [...prev, { email, userId }]
    );
  }

  async function handleCreate() {
    if (!teamName || !selectedMembers.length || !teamLeader) {
      return toast.error("Team name, members & leader are required.");
    }
    let deadline = null;
    if (selectedProject !== "__none") {
      if (!deadlineDate) {
        return toast.error("Please select a deadline.");
      }
      const dt = new Date(`${deadlineDate}T${formatTime()}`);
      if (isNaN(dt.getTime())) {
        return toast.error("Invalid deadline.");
      }
      deadline = dt.toISOString();
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        "/api/projectManagerData/teamManagementData/createTeam",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamName,
            teamLeader,
            members: selectedMembers.filter(
              (m) => m.userId !== teamLeader.userId
            ),
            assignedProject:
              selectedProject === "__none" ? null : selectedProject,
            deadline,
          }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      router.push("/projectManagerData/teamManagementData/ManageTeams");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to create team");
      setError(e.message || "Failed to create team");
    } finally {
      setSubmitting(false);
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

  return (
    <div className="container mx-auto py-8 px-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <XCircle className="mr-2 h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" /> Create New Team
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-1">
            <Label htmlFor="team-name" className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Team Name
            </Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
            />
          </div>

          <div className="space-y-1">
            <Label className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Team Members
            </Label>
            <div className="border rounded p-2 max-h-48 overflow-auto">
              {users.map((u) => (
                <label
                  key={u.UserId}
                  className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <Checkbox
                    checked={selectedMembers.some((m) => m.email === u.email)}
                    onCheckedChange={() => toggleMember(u.email, u.UserId)}
                  />
                  <span>
                    {u.firstname} {u.lastname} ({u.email})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Team Leader
            </Label>
            <Select
              value={teamLeader?.userId || ""}
              onValueChange={(val) => {
                const sel = selectedMembers.find((m) => m.userId === val);
                if (sel) setTeamLeader(sel);
              }}
              disabled={selectedMembers.length < 3}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a leader" />
              </SelectTrigger>
              <SelectContent>
                {selectedMembers.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              Assign Project (Optional)
            </Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.ProjectId} value={p.ProjectId}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProject !== "__none" && (
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
              <Label className="flex items-center mt-2">
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
          )}
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </span>
            ) : (
              "Create Team"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
