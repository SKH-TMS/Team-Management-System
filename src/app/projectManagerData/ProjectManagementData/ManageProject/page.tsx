"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Link2,
  Link2Off,
  RefreshCw,
  Search,
  AlertCircle,
  LayoutGrid,
  LayoutList,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ProjectSection } from "./components/project-section";
import { ProjectSkeleton } from "./components/project-skeleton";
import { EmptyState } from "./components/empty-state";
import { ActionButtons } from "./components/action-buttons";

import { useProjects } from "./hooks/use-projects";
import type { ViewMode } from "./types";

export default function ManageProjectsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);

  const {
    loading,
    error,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    isSelectMode,
    selectedAssignedProjectIds,
    selectedUnassignedProjectIds,
    filteredAssignedProjects,
    filteredUnassignedProjects,
    sortedAssignedProjects,
    fetchProjects,
    toggleSelectMode,
    toggleAssignedProjectSelection,
    toggleUnassignedProjectSelection,
    deleteSelectedProjects,
    unassignSelectedProjects,
  } = useProjects();

  const handleUpdateProject = (projectId: string) => {
    router.push(
      `/projectManagerData/ProjectManagementData/UpdateProject/${projectId}`
    );
  };

  const handleAssignSpecificProject = (projectId: string) => {
    router.push(
      `/projectManagerData/ProjectManagementData/AssignSpecificProject/${projectId}`
    );
  };

  const handleAssignProjects = () => {
    router.push(`/projectManagerData/ProjectManagementData/AssignProject`);
  };

  const handleCreateProject = () => {
    router.push("/projectManagerData/ProjectManagementData/CreateProject");
  };

  const handleAssignedProjectClick = (projectId: string) => {
    if (isSelectMode) {
      toggleAssignedProjectSelection(projectId);
    } else {
      router.push(
        `/projectManagerData/taskManagementData/ProjectTasks/${projectId}`
      );
    }
  };

  const handleUnAssignedProjectClick = (projectId: string) => {
    if (isSelectMode) {
      toggleUnassignedProjectSelection(projectId);
    }
  };

  const handleDeleteConfirm = async () => {
    const success = await deleteSelectedProjects();
    if (success) {
      setShowDeleteConfirm(false);
    }
  };

  const handleUnassignConfirm = async () => {
    const success = await unassignSelectedProjects();
    if (success) {
      setShowUnassignConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manage Projects</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ProjectSkeleton key={i} />
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
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={fetchProjects}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Manage Projects</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <LayoutList className="h-4 w-4" />
            ) : (
              <LayoutGrid className="h-4 w-4" />
            )}
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-8 w-[200px] md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <ActionButtons
        isSelectMode={isSelectMode}
        toggleSelectMode={toggleSelectMode}
        selectedAssignedCount={selectedAssignedProjectIds.length}
        selectedUnassignedCount={selectedUnassignedProjectIds.length}
        onCreateProject={handleCreateProject}
        onAssignProjects={handleAssignProjects}
        onDeleteSelected={() => setShowDeleteConfirm(true)}
        onUnassignSelected={() => setShowUnassignConfirm(true)}
        onAssignSpecificProject={handleAssignSpecificProject}
        selectedUnassignedProjectId={selectedUnassignedProjectIds[0]}
      />

      <div className="mb-6 w-[200px]">
        <Select
          value={filter}
          onValueChange={(v) =>
            setFilter(v as "all" | "assigned" | "unassigned")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter projects..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="assigned">Assigned Projects</SelectItem>
            <SelectItem value="unassigned">Unassigned Projects</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(filter === "all" || filter === "assigned") && (
        <ProjectSection
          title="Assigned Projects"
          projects={sortedAssignedProjects}
          type="assigned"
          viewMode={viewMode}
          isSelectMode={isSelectMode}
          selectedProjectIds={selectedAssignedProjectIds}
          onProjectClick={handleAssignedProjectClick}
          onUpdateProject={handleUpdateProject}
          emptyComponent={
            <EmptyState
              icon={Link2}
              title="No Assigned Projects"
              description="You don't have any assigned projects yet."
              actionLabel="Assign Projects to Teams"
              onAction={handleAssignProjects}
            />
          }
        />
      )}

      {(filter === "all" || filter === "unassigned") && (
        <ProjectSection
          title="Unassigned Projects"
          projects={filteredUnassignedProjects}
          type="unassigned"
          viewMode={viewMode}
          isSelectMode={isSelectMode}
          selectedProjectIds={selectedUnassignedProjectIds}
          onProjectClick={handleUnAssignedProjectClick}
          onUpdateProject={handleUpdateProject}
          emptyComponent={
            <EmptyState
              icon={Link2Off}
              title="No Unassigned Projects"
              description="You don't have any unassigned projects."
              actionLabel="Create New Project"
              onAction={handleCreateProject}
            />
          }
        />
      )}

      {filter === "all" &&
        sortedAssignedProjects.length === 0 &&
        filteredUnassignedProjects.length === 0 && (
          <EmptyState
            icon={Briefcase}
            title="No Projects Found"
            description="You don't have any projects yet."
            actionLabel="Create Your First Project"
            onAction={handleCreateProject}
          />
        )}

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              {selectedUnassignedProjectIds.length} selected project(s)? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Projects
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUnassignConfirm} onOpenChange={setShowUnassignConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Unassign</DialogTitle>
            <DialogDescription>
              Are you sure you want to unassign{" "}
              {selectedAssignedProjectIds.length} selected project(s)? This will
              also delete all tasks in those projects.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnassignConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnassignConfirm}>
              Unassign Projects
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
