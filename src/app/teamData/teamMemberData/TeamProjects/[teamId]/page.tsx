"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { format } from "date-fns";

// Import necessary components and icons
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose, // Added Dialog components
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label"; // Added Label
import { Separator } from "@/components/ui/separator"; // Added Separator
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import {
  Search as SearchIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Eye,
  Info,
  Users,
  ListChecks,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Briefcase,
  FileText,
  Loader2, // Added FileText icon
} from "lucide-react";

// --- Interfaces ---
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

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
  profilepic?: string;
}
// --- End Interfaces ---

export default function TeamMemberProjectsPage() {
  const { teamId } = useParams();
  const router = useRouter();

  // --- State ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamName, setTeamName] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewProjectDetailsData, setViewProjectDetailsData] =
    useState<Project | null>(null); // State for details dialog

  // --- Data Fetching ---
  const fetchTeamProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/teamData/teamMemberData/getTeamProjects/${teamId}`,
        { method: "GET" }
      );
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch projects.");
      }
      setProjects(data.projects || []);
      setTeamName(data.teamName || `Team ${teamId}`);
      setTeamMembers(data.members || []);
    } catch (err: any) {
      console.error("Error fetching team projects:", err);
      const message =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to fetch team projects: ${message}`);
      toast.error(`Failed to fetch team projects. Please try again later.`);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId) {
      fetchTeamProjects();
    }
  }, [teamId, fetchTeamProjects]);

  // --- Event Handlers ---
  const handleNavigateToProjectTasks = (projectId: string) => {
    router.push(`/teamData/teamMemberData/TeamMemberProjectTasks/${projectId}`);
  };

  // Handler to open the details dialog
  const handleOpenProjectDetailsDialog = (project: Project) => {
    setViewProjectDetailsData(project);
  };

  // Handler to close the details dialog
  const handleCloseProjectDetailsDialog = () => {
    setViewProjectDetailsData(null);
  };

  // --- Status Styles ---
  const statusStyles: Record<
    string,
    { border: string; bg: string; badge: string; icon: React.ReactNode }
  > = {
    Pending: {
      border: "border-amber-300",
      bg: "bg-amber-50",
      badge: "text-amber-800 bg-amber-100",
      icon: <ClockIcon className="w-3 h-3" />,
    },
    "In Progress": {
      border: "border-blue-300",
      bg: "bg-blue-50",
      badge: "text-blue-800 bg-blue-100",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    Completed: {
      border: "border-green-300",
      bg: "bg-green-50",
      badge: "text-green-800 bg-green-100",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    Default: {
      border: "border-gray-300",
      bg: "bg-gray-50",
      badge: "text-gray-800 bg-gray-100",
      icon: <ClockIcon className="w-3 h-3" />,
    },
  };

  // --- Memoized Calculations ---
  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) =>
          ["Pending", "In Progress", "Completed"].indexOf(a.status) -
          ["Pending", "In Progress", "Completed"].indexOf(b.status)
      ),
    [projects]
  );

  const filteredProjects = useMemo(
    () =>
      sortedProjects.filter((p) => {
        const matchesStatus =
          statusFilter === "All" || p.status === statusFilter;
        const matchesSearch =
          !searchQuery ||
          p.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          p.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase().trim());
        return matchesStatus && matchesSearch;
      }),
    [sortedProjects, statusFilter, searchQuery]
  );

  const projectStats = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter((p) => p.status === "Completed").length;
    const inProgress = projects.filter(
      (p) => p.status === "In Progress"
    ).length;
    const pending = projects.filter((p) => p.status === "Pending").length;
    const completionPercentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    const reassigned = 0; // Assuming members don't see this status for stats
    return {
      total,
      completed,
      inProgress,
      pending,
      reassigned,
      completionPercentage,
    };
  }, [projects]);

  const getInitials = (firstname?: string, lastname?: string) => {
    if (!firstname) return "?";
    if (!lastname) return firstname.charAt(0).toUpperCase();
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <Skeleton className="h-48 sm:h-56 w-full rounded-xl" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <Skeleton className="h-10 w-full sm:w-auto sm:flex-1" />
          <Skeleton className="h-10 w-full sm:w-1/3" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load Team Projects</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4 mr-2 gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Button>
        <Button onClick={fetchTeamProjects} className="mt-4 gap-1">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* --- TEAM STATS CARD --- */}
        <Card className="overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 shadow-md border-0">
          <CardHeader className="p-4 sm:p-6 pb-0 sm:pb-3">
            <div className="flex items-start sm:items-center justify-between mb-2 flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="h-8 w-8 rounded-full p-0 mr-2"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary/80 flex-shrink-0" />
                  <span className="truncate">{teamName}</span>
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Team Projects Overview
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTeamProjects}
                className="h-8 w-8 rounded-full p-0"
                aria-label="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2">
            <div className="mb-4 sm:mb-6">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Overall Project Completion
                </span>
                <span className="text-xs sm:text-sm font-medium">
                  {projectStats.completionPercentage}%
                </span>
              </div>
              <Progress
                value={projectStats.completionPercentage}
                className="h-2 sm:h-2.5 bg-slate-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 mb-4">
              <div className="bg-white/60 rounded-lg p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col">
                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Briefcase className="h-3 w-3" /> Total Projects
                </span>
                <span className="text-lg sm:text-2xl font-semibold">
                  {projectStats.total}
                </span>
              </div>
              <div className="bg-white/60 rounded-lg p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col">
                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <CheckCircle2 className="h-3 w-3" /> Completed
                </span>
                <span className="text-lg sm:text-2xl font-semibold text-green-600">
                  {projectStats.completed}
                </span>
              </div>
              <div className="bg-white/60 rounded-lg p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col">
                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <ClockIcon className="h-3 w-3" /> In Progress
                </span>
                <span className="text-lg sm:text-2xl font-semibold text-blue-600">
                  {projectStats.inProgress}
                </span>
              </div>
              <div className="bg-white/60 rounded-lg p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col">
                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <AlertCircle className="h-3 w-3" /> Pending
                </span>
                <span className="text-lg sm:text-2xl font-semibold text-slate-600">
                  {projectStats.pending}
                </span>
              </div>
            </div>
            {teamMembers.length > 0 && (
              <div className="bg-white/60 rounded-lg p-3 shadow-sm border border-slate-100 mt-4">
                <h3 className="text-sm font-medium flex items-center gap-1.5 mb-3">
                  <Users className="h-4 w-4 text-muted-foreground" /> Team
                  Members ({teamMembers.length})
                </h3>
                <ScrollArea className="w-full pb-2">
                  <div className="flex items-center gap-2">
                    {teamMembers.map((member) => (
                      <Tooltip key={member.UserId}>
                        <TooltipTrigger>
                          {" "}
                          {/* Removed asChild */}
                          <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-slate-50 shadow-sm flex-shrink-0">
                            <AvatarImage
                              src={member.profilepic}
                              alt={`${member.firstname} ${member.lastname}`}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(member.firstname, member.lastname)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-50 text-black">
                          <div className="text-sm">
                            <p className="font-medium">
                              {member.firstname} {member.lastname}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
        {/* --- END TEAM STATS CARD --- */}

        <h1 className="text-2xl sm:text-3xl font-bold text-center pt-4">
          Projects for {teamName}
        </h1>

        {/* Toolbar: Search + Filter (Original Structure) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="relative w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects by title or description..."
              className="pl-10 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-1/3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9">
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

        {/* Project Grid (Original Structure & Card) */}
        {filteredProjects.length === 0 ? (
          <div className="text-center text-gray-600 my-10 py-10 border rounded-lg bg-slate-50">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-70" />
            <p className="text-lg font-medium">No projects found.</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "All"
                ? "Try adjusting your filters."
                : "No projects assigned to this team yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {filteredProjects.map((p) => {
              const st = statusStyles[p.status] || statusStyles.Default;
              const border = st.border;
              const bg = st.bg;

              return (
                // --- MODIFIED PROJECT CARD: Added onClick for dialog ---
                <Card
                  key={p.ProjectId}
                  className={cn(
                    "relative overflow-hidden group flex flex-col h-64 cursor-pointer", // Added cursor-pointer
                    "p-4 sm:p-6 rounded-lg shadow hover:shadow-lg sm:hover:shadow-xl transform transition-all duration-300 sm:hover:-translate-y-1",
                    border,
                    bg,
                    "border-l-4"
                  )}
                  onClick={() => handleOpenProjectDetailsDialog(p)} // Open details dialog on card click
                >
                  <CardHeader className="flex-row justify-between items-start p-0 mb-2 gap-2">
                    <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2 flex-1">
                      {p.title}
                    </CardTitle>
                    <Badge
                      className={cn(
                        "px-2 py-0.5 text-xs whitespace-nowrap",
                        st.badge
                      )}
                    >
                      {st.icon} <span className="ml-1">{p.status}</span>
                    </Badge>
                  </CardHeader>

                  <CardContent className="flex-1 text-xs sm:text-sm text-gray-700 space-y-2 p-0 overflow-hidden">
                    <p className="line-clamp-3">
                      {p.description || "No description."}
                    </p>
                    {p.deadline && (
                      <p className="flex items-center text-xs text-gray-500 pt-1">
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                        Due: {format(new Date(p.deadline), "PP")}
                      </p>
                    )}
                    {p.tasksIds && (
                      <p className="flex items-center text-xs text-gray-500">
                        <ListChecks className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                        {p.tasksIds.length} Task{p.tasksIds.length !== 1 && "s"}
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="flex items-center justify-between p-0 pt-2">
                    <Tooltip>
                      <TooltipTrigger>
                        {" "}
                        {/* Removed asChild */}
                        <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <span className="text-xs">{p.ProjectId}</span>
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-xs text-gray-400">
                      Created: {format(new Date(p.createdAt), "MMM d, yyyy")}
                    </span>
                  </CardFooter>

                  {/* Keep the View Tasks overlay, but it now navigates */}
                  <div
                    className={cn(
                      "absolute inset-x-0 bottom-0 text-center py-2",
                      "bg-white/70 backdrop-blur-sm",
                      "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      "cursor-pointer border-t border-slate-200"
                    )}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click when clicking overlay
                      handleNavigateToProjectTasks(p.ProjectId);
                    }}
                  >
                    <span className="text-sm font-medium text-primary hover:underline">
                      View Tasks
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* --- ADDED PROJECT DETAILS DIALOG --- */}
        <Dialog
          open={!!viewProjectDetailsData}
          onOpenChange={(open) => !open && handleCloseProjectDetailsDialog()}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="truncate">
                  {viewProjectDetailsData?.title}
                </span>
                {viewProjectDetailsData?.status && (
                  <Badge
                    className={cn(
                      "ml-auto px-2 py-0.5 text-xs whitespace-nowrap",
                      (
                        statusStyles[viewProjectDetailsData.status] ||
                        statusStyles.Default
                      ).badge
                    )}
                  >
                    {
                      (
                        statusStyles[viewProjectDetailsData.status] ||
                        statusStyles.Default
                      ).icon
                    }
                    <span className="ml-1">
                      {viewProjectDetailsData.status}
                    </span>
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Detailed information about the project.
              </DialogDescription>
            </DialogHeader>
            {viewProjectDetailsData && (
              <ScrollArea className="flex-grow pr-6 -mr-6">
                <div className="space-y-4 py-4 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs font-medium text-muted-foreground">
                        <Users className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                        Team
                      </Label>
                      <p className="font-medium">{teamName}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs font-medium text-muted-foreground">
                        <ListChecks className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                        Tasks
                      </Label>
                      <p className="font-medium">
                        {viewProjectDetailsData.tasksIds?.length ?? 0}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs font-medium text-muted-foreground">
                        <CalendarIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                        Deadline
                      </Label>
                      <p className="font-medium">
                        {viewProjectDetailsData.deadline
                          ? format(
                              new Date(viewProjectDetailsData.deadline),
                              "PPP p"
                            )
                          : "Not Set"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs font-medium text-muted-foreground">
                        <ClockIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                        Created
                      </Label>
                      <p>
                        {format(
                          new Date(viewProjectDetailsData.createdAt),
                          "PPP p"
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs font-medium text-muted-foreground">
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                        Last Updated
                      </Label>
                      <p>
                        {format(
                          new Date(viewProjectDetailsData.updatedAt),
                          "PPP p"
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs font-medium text-muted-foreground">
                        <Info className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                        Project ID
                      </Label>
                      <p className="font-mono text-xs">
                        {viewProjectDetailsData.ProjectId}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-1">
                    <Label
                      htmlFor="details-description"
                      className="text-xs font-medium text-muted-foreground flex items-center"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                      Description
                    </Label>
                    <div className="text-sm mt-1 whitespace-pre-line bg-slate-50 p-3 rounded-md border">
                      {viewProjectDetailsData.description ||
                        "No description provided."}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
            <DialogFooter className="pt-4 border-t mt-auto">
              <Button
                variant="outline"
                onClick={handleCloseProjectDetailsDialog}
              >
                Close
              </Button>
              <Button
                onClick={() =>
                  handleNavigateToProjectTasks(
                    viewProjectDetailsData!.ProjectId
                  )
                }
              >
                <Eye className="mr-2 h-4 w-4" /> View Tasks
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* --- END PROJECT DETAILS DIALOG --- */}
      </div>
    </TooltipProvider>
  );
}
