"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

import {
  Search as SearchIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Eye,
  Info,
} from "lucide-react";

interface Project {
  ProjectId: string;
  title: string;
  description: string;
  createdBy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  tasksIds?: string[];
}

export default function TeamProjectsPage() {
  const { teamId } = useParams();
  const router = useRouter();

  const [teamName, setTeamName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `/api/teamData/teamMemberData/getTeamProjects/${teamId}`
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setProjects(data.projects);
        setTeamName(data.teamname);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Could not load projects.");
        toast.error(err.message || "Could not load projects.");
        router.push("/teamData/ProfileTeam");
      } finally {
        setLoading(false);
      }
    }
    if (teamId) fetchData();
  }, [teamId, router]);

  const statusStyles: Record<
    string,
    { border: string; bg: string; badge: string }
  > = {
    Pending: {
      border: "border-amber-300",
      bg: "bg-amber-50",
      badge: "text-amber-800 bg-amber-100",
    },
    "In Progress": {
      border: "border-blue-300",
      bg: "bg-blue-50",
      badge: "text-blue-800 bg-blue-100",
    },
    Completed: {
      border: "border-green-300",
      bg: "bg-green-50",
      badge: "text-green-800 bg-green-100",
    },
  };

  const sorted = useMemo(
    () =>
      [...projects].sort(
        (a, b) =>
          ["Pending", "In Progress", "Completed"].indexOf(a.status) -
          ["Pending", "In Progress", "Completed"].indexOf(b.status)
      ),
    [projects]
  );

  const filtered = useMemo(
    () =>
      sorted.filter((p) => {
        const matchesStatus =
          statusFilter === "All" || p.status === statusFilter;
        const matchesSearch = p.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim());
        return matchesStatus && matchesSearch;
      }),
    [sorted, statusFilter, searchQuery]
  );

  const viewTasks = (id: string) =>
    router.push(`/teamData/teamMemberData/TeamMemberProjectTasks/${id}`);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse p-4 sm:p-6 h-56" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertTitle>Failed to load</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          Projects for {teamName}
        </h1>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-1/3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                {["All", "Pending", "In Progress", "Completed"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-600 text-sm sm:text-base">
            No projects match your criteria.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map((p) => {
              const st = statusStyles[p.status] || statusStyles.Pending;
              return (
                <Card
                  key={p.ProjectId}
                  className={cn(
                    "relative overflow-hidden group flex flex-col h-64",
                    "p-4 sm:p-6 rounded-lg shadow hover:shadow-2xl",
                    "transform hover:-translate-y-1 transition-all duration-300",
                    "border-l-4",
                    st.border,
                    st.bg
                  )}
                >
                  <CardHeader className="flex justify-between items-center p-0 mb-2">
                    <CardTitle className="text-lg sm:text-xl line-clamp-1">
                      {p.title}
                    </CardTitle>
                    <Badge
                      className={cn(
                        "px-2 py-1 text-xs sm:text-sm hover:bg-inherit",
                        st.badge
                      )}
                    >
                      {p.status}
                    </Badge>
                  </CardHeader>

                  <CardContent className="flex-1 text-sm sm:text-base text-gray-700 space-y-2 p-0">
                    <p className="line-clamp-3">{p.description}</p>
                    {p.deadline && (
                      <p className="flex items-center text-xs text-gray-500">
                        <CalendarIcon className="mr-1 h-4 w-4" />
                        {new Date(p.deadline).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          hour12: true,
                        })}
                      </p>
                    )}
                    {p.tasksIds && (
                      <p className="flex items-center text-xs text-gray-500">
                        <ClockIcon className="mr-1 h-4 w-4" />
                        {p.tasksIds.length} Task
                        {p.tasksIds.length !== 1 && "s"}
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="flex items-center justify-between p-2 pt-2 pd-5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <span className="text-xs sm:text-sm">
                          {p.ProjectId}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-xs sm:text-xs text-gray-400">
                      Created:{" "}
                      {new Date(p.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </CardFooter>

                  <div
                    className="absolute inset-x-0 bottom-0 py-1 sm:py-2
             text-gray-500 flex items-center justify-center gap-1
             opacity-100 sm:opacity-0 sm:group-hover:opacity-100
             transition-opacity cursor-pointer"
                    onClick={() => viewTasks(p.ProjectId)}
                  >
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">View Tasks</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
