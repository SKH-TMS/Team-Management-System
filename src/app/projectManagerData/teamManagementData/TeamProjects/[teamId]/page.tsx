"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search as SearchIcon,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  XCircle,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  ProjectId: string;
  title: string;
  description: string;
  status: string;
  deadline?: string;
  tasksIds?: string[];
}

export default function TeamProjectsPage() {
  const { teamId } = useParams();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/projectManagerData/teamManagementData/getTeamProjects/${teamId}`
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setProjects(data.projects);
        setTeamName(data.teamName);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load projects");
        toast.error(e.message || "Failed to load projects");
        router.push("/projectManagerData/teamManagementData/ManageTeams");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [teamId, router]);

  const statusOrder: Record<string, number> = {
    Pending: 1,
    "In Progress": 2,
    Completed: 3,
  };
  const sorted = useMemo(
    () =>
      [...projects].sort(
        (a, b) => (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0)
      ),
    [projects]
  );
  const filtered = useMemo(
    () =>
      sorted
        .filter((p) =>
          statusFilter === "All" ? true : p.status === statusFilter
        )
        .filter((p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
        ),
    [sorted, statusFilter, searchQuery]
  );

  const statusStyles: Record<
    string,
    { border: string; badge: string; bg: string }
  > = {
    Pending: {
      border: "border-yellow-300",
      badge: "text-yellow-800 bg-yellow-100",
      bg: "bg-yellow-50",
    },
    "In Progress": {
      border: "border-blue-300",
      badge: "text-blue-800 bg-blue-100",
      bg: "bg-blue-50",
    },
    Completed: {
      border: "border-green-300",
      badge: "text-green-800 bg-green-100",
      bg: "bg-green-50",
    },
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) setSelectedProjectIds([]);
  };
  const toggleProject = (id: string) =>
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  const handleDeleteSelected = async () => {
    if (!confirm("Unassign selected projects?")) return;
    try {
      const res = await fetch(
        "/api/projectManagerData/teamManagementData/unassignProject",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId,
            projectIds: selectedProjectIds,
          }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setProjects((p) =>
        p.filter((x) => !selectedProjectIds.includes(x.ProjectId))
      );
      toast.success(data.message);
      setSelectedProjectIds([]);
      setIsSelectMode(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to unassign");
    }
  };

  const handleAssign = () =>
    router.push(
      `/projectManagerData/teamManagementData/AssignProjectToTeam/${teamId}`
    );
  const handleUpdate = () => {
    if (selectedProjectIds.length === 1) {
      router.push(
        `/projectManagerData/ProjectManagementData/UpdateProject/${selectedProjectIds[0]}`
      );
    }
  };

  if (loading) {
    return (
      <div className="p-6 container mx-auto">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
      </div>
    );
  }
  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <XCircle className="mr-2 h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">
        Projects for {teamName}
      </h1>

      {/* Toolbar */}
      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <Button onClick={handleAssign} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Assign Project
          </Button>
          <Button onClick={toggleSelectMode} variant="outline">
            {isSelectMode ? "Cancel Select" : "Select Projects"}
          </Button>
          {isSelectMode && selectedProjectIds.length > 0 && (
            <Button onClick={handleDeleteSelected} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Unassign
            </Button>
          )}
          {isSelectMode && selectedProjectIds.length === 1 && (
            <Button onClick={handleUpdate} variant="outline">
              <Edit2 className="mr-2 h-4 w-4" /> Update
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Select onValueChange={setStatusFilter} defaultValue="All">
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              {["All", "Pending", "In Progress", "Completed"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative w-60">
            <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search title…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filtered.map((p) => {
          const isSelected =
            isSelectMode && selectedProjectIds.includes(p.ProjectId);
          const { border, badge, bg } =
            statusStyles[p.status] || statusStyles.Pending;
          const background = isSelected ? "bg-pink-50" : bg;

          return (
            <Card
              key={p.ProjectId}
              className={cn(
                "group cursor-pointer shadow rounded-lg p-6 " +
                  "hover:shadow-lg transform hover:-translate-y-1 " +
                  "transition-all border-l-4",
                border,
                background
              )}
              onClick={() =>
                isSelectMode
                  ? toggleProject(p.ProjectId)
                  : router.push(
                      `/projectManagerData/taskManagementData/ProjectTasks/${p.ProjectId}`
                    )
              }
            >
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isSelectMode && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleProject(p.ProjectId)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <CardTitle>{p.title}</CardTitle>
                </div>
                <Badge className={cn(badge)}>{p.status}</Badge>
              </CardHeader>

              <CardContent className="space-y-2 text-sm">
                <p>{p.description}</p>
                {p.deadline && (
                  <p className="flex items-center space-x-1 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(p.deadline).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        hour12: true,
                      })}
                    </span>
                  </p>
                )}
                {p.tasksIds && (
                  <p className="flex items-center space-x-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{p.tasksIds.length} Tasks</span>
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
