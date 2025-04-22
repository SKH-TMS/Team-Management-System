"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Project, ProjectType, ViewMode } from "../types";
import { ProjectCard } from "./project-card";
import { ProjectListItem } from "./project-list-item";

interface ProjectSectionProps {
  title: string;
  projects: Project[];
  type: ProjectType;
  viewMode: ViewMode;
  isSelectMode: boolean;
  selectedProjectIds: string[];
  onProjectClick: (projectId: string) => void;
  onUpdateProject: (projectId: string) => void;
  emptyComponent: React.ReactNode;
}

export function ProjectSection({
  title,
  projects,
  type,
  viewMode,
  isSelectMode,
  selectedProjectIds,
  onProjectClick,
  onUpdateProject,
  emptyComponent,
}: ProjectSectionProps) {
  if (projects.length === 0) {
    return emptyComponent;
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Badge className="ml-2">{projects.length}</Badge>
      </div>

      {projects.length === 0 ? (
        <Alert>
          <AlertTitle className="h-4 w-4" />
          <AlertTitle>No results</AlertTitle>
          <AlertDescription>
            No projects match your search criteria.
          </AlertDescription>
        </Alert>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.ProjectId}
              project={project}
              isSelected={selectedProjectIds.includes(project.ProjectId)}
              isSelectMode={isSelectMode}
              onClick={() => onProjectClick(project.ProjectId)}
              onUpdate={() => onUpdateProject(project.ProjectId)}
              type={type}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectListItem
              key={project.ProjectId}
              project={project}
              isSelected={selectedProjectIds.includes(project.ProjectId)}
              isSelectMode={isSelectMode}
              onClick={() => onProjectClick(project.ProjectId)}
              onUpdate={() => onUpdateProject(project.ProjectId)}
              type={type}
            />
          ))}
        </div>
      )}
    </div>
  );
}
