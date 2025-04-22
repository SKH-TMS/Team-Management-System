export interface Project {
  ProjectId: string;
  title: string;
  description: string;
  createdBy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  tasksIds?: string[];
  teamIds: string;
  teamName: string;
}

export type ProjectFilter = "all" | "assigned" | "unassigned";
export type ViewMode = "grid" | "list";
export type ProjectType = "assigned" | "unassigned";

export interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  isSelectMode: boolean;
  onClick: () => void;
  onUpdate: () => void;
  type: ProjectType;
}
