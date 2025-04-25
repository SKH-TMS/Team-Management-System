"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Briefcase,
  LayoutGrid,
  LayoutList,
  Search,
  Filter,
  X,
  Loader2,
  PlusCircle,
  ArrowLeft,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  Info,
  Github,
  Copy,
  MessageSquare, // Icons for Details Dialog
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Define or import types ---
// Assuming types are defined here or imported from a shared location
interface ISubtask {
  SubtaskId: string;
  parentTaskId: string;
  title: string;
  description: string;
  assignedTo: string; // UserID
  deadline: string; // ISO String or Date
  status: string;
  gitHubUrl?: string;
  context?: string;
  submittedBy?: string; // UserID
  createdAt: string; // ISO String or Date
  updatedAt: string; // ISO String or Date
}

interface ITask {
  // Parent Task Details
  TaskId: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
}

interface Member {
  // Team Member Details
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
}
// --- End Type Definitions ---

// --- Subtask Card Component (Placeholder - Extract Later) ---
interface SubtaskCardProps {
  subtask: ISubtask;
  assignee?: Member | null;
  onClick: (subtask: ISubtask) => void;
}

function SubtaskCard({ subtask, assignee, onClick }: SubtaskCardProps) {
  const getStatusBadge = () => {
    switch (subtask.status?.toLowerCase()) {
      case "in progress":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5"
          >
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="text-xs px-1.5 py-0.5">
            {subtask.status || "Unknown"}
          </Badge>
        );
    }
  };
  const getBgColor = () => {
    switch (subtask.status?.toLowerCase()) {
      case "in progress":
        return "bg-blue-50 border-blue-200";
      case "completed":
        return "bg-green-50 border-green-200";
      case "pending":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-card border";
    }
  };

  return (
    // --- FIX: Corrected cn() usage ---
    <Card
      className={cn(
        "hover:shadow-md transition-shadow cursor-pointer border",
        getBgColor()
      )}
      onClick={() => onClick(subtask)}
    >
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base font-medium line-clamp-2">
            {subtask.title}
          </CardTitle>
          {/* --- FIX: Render the badge component --- */}
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-2 pb-3 px-4">
        <p className="text-muted-foreground line-clamp-2">
          {subtask.description}
        </p>
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          Due: {format(new Date(subtask.deadline), "PP")}
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <User className="w-3.5 h-3.5 mr-1.5" />
          Assignee:{" "}
          {assignee ? `${assignee.firstname} ${assignee.lastname}` : "N/A"}
        </div>
      </CardContent>
      {/* Footer can be added later for quick actions if needed */}
    </Card>
  );
}
// --- End Placeholder Subtask Card ---

export default function SubTasksPage() {
  const params = useParams();
  const parentTaskId = params.taskId as string;
  const router = useRouter();

  // State
  const [subtasks, setSubtasks] = useState<ISubtask[]>([]);
  const [parentTask, setParentTask] = useState<ITask | null>(null);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI State
  // const [viewMode, setViewMode] = useState<"grid" | "list">("grid"); // Removed viewMode for simplicity for now
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [viewSubtaskDetailsData, setViewSubtaskDetailsData] =
    useState<ISubtask | null>(null);

  // Fetch Subtasks and Parent Task Info
  const fetchSubtaskData = useCallback(async () => {
    if (!parentTaskId) {
      setError("Parent Task ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/teamData/teamLeaderData/getSubTasks/${parentTaskId}`,
        { method: "GET" }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch subtasks.");
      }
      setParentTask(data.parentTask || null);
      setSubtasks(data.subtasks || []);
      setTeamMembers(data.teamMembers || []);
    } catch (err: any) {
      console.error("Error fetching subtasks:", err);
      const message = err.message || "Failed to load subtasks.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [parentTaskId]);

  useEffect(() => {
    fetchSubtaskData();
  }, [fetchSubtaskData]);

  // --- Event Handlers ---
  const handleNavigateToCreate = () => {
    router.push(`/teamData/teamLeaderData/CreateSubTask/${parentTaskId}`);
  };

  const handleOpenDetailsDialog = (subtask: ISubtask) => {
    setViewSubtaskDetailsData(subtask);
  };

  const handleCloseDetailsDialog = () => {
    setViewSubtaskDetailsData(null);
  };

  const copyToClipboard = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("URL copied to clipboard!");
    });
  };

  // Filter/Sort Logic
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setAssigneeFilter("all");
  };

  const filteredAndSortedSubtasks = subtasks
    // --- FIX: Corrected filter logic ---
    .filter((subtask) => {
      const lowerSearchQuery = searchQuery.toLowerCase();
      const assignee = teamMembers.find((m) => m.UserId === subtask.assignedTo);
      const assigneeName = assignee
        ? `${assignee.firstname} ${assignee.lastname}`.toLowerCase()
        : "";

      const matchesSearch =
        searchQuery === "" ||
        subtask.title.toLowerCase().includes(lowerSearchQuery) ||
        subtask.description.toLowerCase().includes(lowerSearchQuery) ||
        assigneeName.includes(lowerSearchQuery);

      const matchesStatus =
        statusFilter === "all" ||
        subtask.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesAssignee =
        assigneeFilter === "all" || subtask.assignedTo === assigneeFilter;

      return matchesSearch && matchesStatus && matchesAssignee;
    })
    .sort((a, b) => {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/2 mb-6" />
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Subtasks</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Parent Task Header */}
      <Card className="mb-6 bg-muted/50">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="absolute top-4 left-4 h-7 w-7 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl sm:text-2xl text-center pt-2">
            Subtasks for: {parentTask?.title || "Task"}
          </CardTitle>
          {parentTask?.description && (
            <CardDescription className="text-center pt-1">
              {parentTask.description}
            </CardDescription>
          )}
        </CardHeader>
        {parentTask?.deadline && (
          <CardFooter className="text-xs sm:text-sm text-muted-foreground justify-center pb-4">
            <Calendar className="w-4 h-4 mr-1.5" /> Parent Task Deadline:{" "}
            {format(new Date(parentTask.deadline), "PPPp")}
          </CardFooter>
        )}
      </Card>

      {/* Actions & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <Button onClick={handleNavigateToCreate} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Create Subtask
        </Button>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subtasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full sm:w-40 md:w-48 h-9"
            />
          </div>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-full sm:w-auto md:w-[180px] h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Filter Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.UserId} value={member.UserId}>
                  {member.firstname} {member.lastname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-auto md:w-[160px] h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery ||
            statusFilter !== "all" ||
            assigneeFilter !== "all") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="h-9 w-9 flex-shrink-0"
            >
              {" "}
              <X className="h-4 w-4" />{" "}
            </Button>
          )}
          {/* Removed View Toggle Button */}
        </div>
      </div>

      {/* Subtask List/Grid */}
      {subtasks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card mt-6">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Subtasks Created Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create the first subtask for this main task.
          </p>
          <Button onClick={handleNavigateToCreate}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Subtask
          </Button>
        </div>
      ) : filteredAndSortedSubtasks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card mt-6">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Matching Subtasks</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search or filter criteria.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        </div>
      ) : (
        // --- FIX: Corrected grid layout and map function ---
        <div
          className={`grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
        >
          {filteredAndSortedSubtasks.map((subtask) => {
            const assignee = teamMembers.find(
              (m) => m.UserId === subtask.assignedTo
            );
            return (
              <SubtaskCard
                key={subtask.SubtaskId}
                subtask={subtask}
                assignee={assignee}
                onClick={handleOpenDetailsDialog}
              />
            );
          })}
        </div>
      )}

      {/* --- Subtask Details Dialog --- */}
      <Dialog
        open={!!viewSubtaskDetailsData}
        onOpenChange={(open) => !open && handleCloseDetailsDialog()}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Subtask: {viewSubtaskDetailsData?.title}
            </DialogTitle>
            <DialogDescription>Details for this subtask.</DialogDescription>
          </DialogHeader>
          {viewSubtaskDetailsData && (
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <User className="w-3.5 h-3.5 mr-1.5" /> Assignee
                  </Label>
                  <p>
                    {teamMembers.find(
                      (m) => m.UserId === viewSubtaskDetailsData.assignedTo
                    )?.firstname ?? "N/A"}{" "}
                    {teamMembers.find(
                      (m) => m.UserId === viewSubtaskDetailsData.assignedTo
                    )?.lastname ?? ""}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" /> Deadline
                  </Label>
                  <p>
                    {format(new Date(viewSubtaskDetailsData.deadline), "PPPp")}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Info className="w-3.5 h-3.5 mr-1.5" /> Status
                  </Label>
                  <p>{viewSubtaskDetailsData.status}</p>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center text-xs font-medium text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 mr-1.5" /> Last Updated
                  </Label>
                  <p>
                    {format(new Date(viewSubtaskDetailsData.updatedAt), "PPp")}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <Label
                  htmlFor="details-sub-description"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Description
                </Label>
                <Textarea
                  id="details-sub-description"
                  value={viewSubtaskDetailsData.description}
                  readOnly
                  className="min-h-[80px] bg-muted/30 border-none"
                />
              </div>

              {/* Display Subtask Submission if available */}
              {viewSubtaskDetailsData.status === "Completed" && (
                <>
                  <Separator />
                  <h4 className="text-base font-semibold pt-2">
                    Submission Details
                  </h4>
                  <div className="space-y-3 pl-2 border-l-2">
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs font-medium text-muted-foreground">
                        <User className="w-3.5 h-3.5 mr-1.5" /> Submitted By
                      </Label>
                      {/* --- FIX: Corrected submittedBy check and find logic --- */}
                      <p className="text-sm">
                        {viewSubtaskDetailsData.submittedBy &&
                        viewSubtaskDetailsData.submittedBy !== "Not-submitted"
                          ? (() => {
                              const s = teamMembers.find(
                                (m: Member) =>
                                  m.UserId ===
                                  viewSubtaskDetailsData?.submittedBy
                              );
                              return s
                                ? `${s.firstname} ${s.lastname}`
                                : `User ID: ${viewSubtaskDetailsData.submittedBy}`;
                            })()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="details-sub-github"
                        className="flex items-center text-xs font-medium text-muted-foreground"
                      >
                        <Github className="w-3.5 h-3.5 mr-1.5" /> GitHub URL
                      </Label>
                      {viewSubtaskDetailsData.gitHubUrl ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            id="details-sub-github"
                            value={viewSubtaskDetailsData.gitHubUrl}
                            readOnly
                            className="font-mono text-xs h-8 flex-1 bg-muted/30 border-none"
                          />
                          {/* --- FIX: Corrected copyToClipboard call --- */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() =>
                              copyToClipboard(viewSubtaskDetailsData?.gitHubUrl)
                            }
                            aria-label="Copy GitHub URL"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No URL provided.
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="details-sub-context"
                        className="flex items-center text-xs font-medium text-muted-foreground"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Context
                      </Label>
                      <Textarea
                        id="details-sub-context"
                        value={
                          viewSubtaskDetailsData.context ||
                          "No context provided."
                        }
                        readOnly
                        className="min-h-[80px] text-sm bg-muted/30 border-none"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {/* --- FIX: Corrected DialogFooter closing tag --- */}
          <DialogFooter className="pt-4 mt-4 border-t">
            <Button variant="outline" onClick={handleCloseDetailsDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div> // --- FIX: Added closing div ---
  );
} // --- FIX: Added closing brace ---
