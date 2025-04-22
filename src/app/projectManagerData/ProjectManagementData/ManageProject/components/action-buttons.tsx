"use client";

import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  Link2,
  Link2Off,
  PlusCircle,
  Square,
  Trash2,
  Users,
} from "lucide-react";

interface ActionButtonsProps {
  isSelectMode: boolean;
  toggleSelectMode: () => void;
  selectedAssignedCount: number;
  selectedUnassignedCount: number;
  onCreateProject: () => void;
  onAssignProjects: () => void;
  onDeleteSelected: () => void;
  onUnassignSelected: () => void;
  onAssignSpecificProject: (projectId: string) => void;
  selectedUnassignedProjectId?: string;
}

export function ActionButtons({
  isSelectMode,
  toggleSelectMode,
  selectedAssignedCount,
  selectedUnassignedCount,
  onCreateProject,
  onAssignProjects,
  onDeleteSelected,
  onUnassignSelected,
  onAssignSpecificProject,
  selectedUnassignedProjectId,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button onClick={onCreateProject} className="gap-1.5">
        <PlusCircle className="h-4 w-4" />
        Create New Project
      </Button>

      <Button
        onClick={onAssignProjects}
        variant="secondary"
        className="gap-1.5"
      >
        <Users className="h-4 w-4" />
        Assign Projects to Teams
      </Button>

      <Button
        onClick={toggleSelectMode}
        variant={isSelectMode ? "destructive" : "outline"}
        className="gap-1.5"
      >
        {isSelectMode ? (
          <CheckSquare className="h-4 w-4" />
        ) : (
          <Square className="h-4 w-4" />
        )}
        {isSelectMode ? "Cancel Selection" : "Select Projects"}
      </Button>

      {selectedAssignedCount > 0 && (
        <Button
          variant="destructive"
          className="gap-1.5"
          onClick={onUnassignSelected}
        >
          <Link2Off className="h-4 w-4" />
          Unassign Selected ({selectedAssignedCount})
        </Button>
      )}

      {selectedUnassignedCount > 0 && (
        <Button
          variant="destructive"
          className="gap-1.5"
          onClick={onDeleteSelected}
        >
          <Trash2 className="h-4 w-4" />
          Delete Selected ({selectedUnassignedCount})
        </Button>
      )}

      {selectedUnassignedCount === 1 && selectedUnassignedProjectId && (
        <Button
          variant="secondary"
          className="gap-1.5"
          onClick={() => onAssignSpecificProject(selectedUnassignedProjectId)}
        >
          <Link2 className="h-4 w-4" />
          Assign Project
        </Button>
      )}
    </div>
  );
}
