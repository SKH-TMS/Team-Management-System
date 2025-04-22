"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, PlusCircle, Loader2 } from "lucide-react";

interface ITeam {
  teamId: string;
  teamName: string;
}

interface IProject {
  ProjectId: string;
  title: string;
  description: string;
}

export default function AssignProjectToTeam() {
  const { teamId } = useParams();
  const router = useRouter();

  const [team, setTeam] = useState<ITeam | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<"existing" | "new">(
    "existing"
  );

  const [unassignedProjects, setUnassignedProjects] = useState<IProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [deadlineDate, setDeadlineDate] = useState("");
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedAmPm, setSelectedAmPm] = useState("AM");

  const [loading, setLoading] = useState(false);

  const getFormattedTime = () => {
    let hour = parseInt(selectedHour, 10);
    if (selectedAmPm === "PM" && hour !== 12) hour += 12;
    if (selectedAmPm === "AM" && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, "0")}:${selectedMinute}:00`;
  };

  useEffect(() => {
    if (!teamId) return;
    fetch(`/api/projectManagerData/teamManagementData/getTeamData/${teamId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTeam(data.team);
        else toast.error(data.message || "Failed to load team");
      })
      .catch(() => toast.error("Failed to load team"));
  }, [teamId]);

  useEffect(() => {
    if (assignmentMode !== "existing") return;
    fetch("/api/projectManagerData/projectManagementData/getUnassignedProjects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUnassignedProjects(data.projects);
        else toast.error(data.message || "Failed to load projects");
      })
      .catch(() => toast.error("Failed to load projects"));
  }, [assignmentMode]);

  const handleAssignExisting = async () => {
    if (!selectedProject || !deadlineDate) {
      toast.error("Select a project and deadline");
      return;
    }
    setLoading(true);
    const combined = new Date(
      `${deadlineDate}T${getFormattedTime()}`
    ).toISOString();
    try {
      const res = await fetch(
        `/api/projectManagerData/projectManagementData/assignProject/${selectedProject.ProjectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId, deadline: combined }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Project assigned!");
        router.back();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to assign project");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAssign = async () => {
    if (!title || !description || !deadlineDate) {
      toast.error("Fill in all fields");
      return;
    }
    setLoading(true);
    const combined = new Date(
      `${deadlineDate}T${getFormattedTime()}`
    ).toISOString();
    try {
      const res = await fetch(
        "/api/projectManagerData/projectManagementData/createProject",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            deadline: combined,
            assignedTeam: team,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Project created & assigned!");
        router.back();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">
              Assign Project to{" "}
              <span className="text-blue-600">{team?.teamName || "…"}</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs
              defaultValue={assignmentMode}
              onValueChange={(v) => setAssignmentMode(v as "existing" | "new")}
            >
              <TabsList className="w-full">
                <TabsTrigger value="existing" className="w-1/2">
                  <PlusCircle className="mr-2 inline-block h-4 w-4" />
                  Existing
                </TabsTrigger>
                <TabsTrigger value="new" className="w-1/2">
                  Create New
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="pt-4 space-y-4">
                <div className="space-y-1">
                  <Label>Select a Project</Label>
                  <Select
                    onValueChange={(val) => {
                      const proj = unassignedProjects.find(
                        (p) => p.ProjectId === val
                      );
                      setSelectedProject(proj || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose project" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedProjects.map((p) => (
                        <SelectItem key={p.ProjectId} value={p.ProjectId}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProject && (
                  <>
                    <div className="space-y-1">
                      <Label>Deadline Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          type="date"
                          value={deadlineDate}
                          onChange={(e) => setDeadlineDate(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {["Hour", "Minute", "AM / PM"].map((lbl, idx) => (
                        <div key={idx} className="flex-1 space-y-1">
                          <Label>{lbl}</Label>
                          <Select
                            value={
                              lbl === "Hour"
                                ? selectedHour
                                : lbl === "Minute"
                                  ? selectedMinute
                                  : selectedAmPm
                            }
                            onValueChange={(v) => {
                              if (lbl === "Hour") setSelectedHour(v);
                              else if (lbl === "Minute") setSelectedMinute(v);
                              else setSelectedAmPm(v);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {lbl === "Hour"
                                ? Array.from({ length: 12 }, (_, i) =>
                                    (i + 1).toString().padStart(2, "0")
                                  ).map((h) => (
                                    <SelectItem key={h} value={h}>
                                      {h}
                                    </SelectItem>
                                  ))
                                : lbl === "Minute"
                                  ? ["00", "15", "30", "45"].map((m) => (
                                      <SelectItem key={m} value={m}>
                                        {m}
                                      </SelectItem>
                                    ))
                                  : ["AM", "PM"].map((ap) => (
                                      <SelectItem key={ap} value={ap}>
                                        {ap}
                                      </SelectItem>
                                    ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full flex justify-center"
                      onClick={handleAssignExisting}
                      disabled={loading}
                    >
                      {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Assign Project
                    </Button>
                  </>
                )}
              </TabsContent>

              <TabsContent value="new" className="pt-4 space-y-4">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input
                    placeholder="Project title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Project description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Deadline Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2"></div>

                <Button
                  className="w-full flex justify-center"
                  onClick={handleCreateAndAssign}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create & Assign
                </Button>
              </TabsContent>
            </Tabs>

            <Separator />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
