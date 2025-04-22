"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  ListChecks,
  Tag,
  Users,
} from "lucide-react";
import type { ProjectCardProps } from "../types";
import { memo } from "react";

const ProjectListItem = memo(
  ({
    project,
    isSelected,
    isSelectMode,
    onClick,
    onUpdate,
    type,
  }: ProjectCardProps) => {
    const getBgColor = () => {
      if (isSelected) return "bg-blue-50 border-blue-300";

      if (type === "assigned") {
        switch (project.status) {
          case "In Progress":
            return "bg-blue-50 border-blue-200";
          case "Completed":
            return "bg-green-50 border-green-200";
          case "Pending":
            return "bg-amber-50 border-amber-200";
          default:
            return "";
        }
      } else {
        return "bg-slate-50 border-slate-200";
      }
    };

    // Get status badge
    const getStatusBadge = () => {
      switch (project.status) {
        case "In Progress":
          return (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              <Clock className="w-3 h-3 mr-1" />
              In Progress
            </Badge>
          );
        case "Completed":
          return (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 hover:bg-green-200"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          );
        case "Pending":
          return (
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-800 hover:bg-amber-200"
            >
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          );
        default:
          return (
            <Badge variant="outline">
              <Tag className="w-3 h-3 mr-1" />
              {project.status}
            </Badge>
          );
      }
    };

    return (
      <div
        className={`flex items-center p-4 border rounded-lg ${getBgColor()} ${
          isSelectMode ? "cursor-pointer" : "cursor-default"
        } hover:shadow-md transition-all duration-200`}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {isSelectMode && (
          <div className="mr-4">
            <Checkbox checked={isSelected} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{project.title}</h3>
            {getStatusBadge()}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Tag className="w-3 h-3 mr-1" />
              <span>{project.ProjectId}</span>
            </div>

            {project.deadline && (
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                <span>
                  {new Date(project.deadline).toLocaleDateString("en-US", {
                    dateStyle: "medium",
                  })}
                </span>
              </div>
            )}

            {type === "assigned" && (
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                <span className="truncate max-w-[150px]">
                  {project.teamName}
                </span>
              </div>
            )}

            {project.tasksIds && (
              <div className="flex items-center">
                <ListChecks className="w-3 h-3 mr-1" />
                <span>{project.tasksIds.length} tasks</span>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="ml-2"
          onClick={(e) => {
            e.stopPropagation();
            onUpdate();
          }}
        >
          <Edit className="h-4 w-4 mr-1" />
          Update
        </Button>
      </div>
    );
  }
);

ProjectListItem.displayName = "ProjectListItem";

export { ProjectListItem };
