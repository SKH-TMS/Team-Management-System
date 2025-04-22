"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const ProjectCard = memo(
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
      <Card
        className={`group relative hover:shadow-lg hover:-translate-y-1 cursor-pointer duration-300 ${getBgColor()}`}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <CardHeader className="pb-2 relative">
          {isSelectMode && (
            <div className="absolute left-2 top-2">
              <Checkbox checked={isSelected} />
            </div>
          )}
          <CardTitle className={`text-center ${isSelectMode ? "pl-6" : ""}`}>
            {project.title}
          </CardTitle>
          {getStatusBadge()}
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>

          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center">
              <Tag className="w-3 h-3 mr-1.5" />
              <span className="font-medium">ID:</span>
              <span className="ml-1">{project.ProjectId}</span>
            </div>

            {project.deadline && (
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1.5" />
                <span className="font-medium">Deadline:</span>
                <span className="ml-1">
                  {new Date(project.deadline).toLocaleDateString("en-US", {
                    dateStyle: "medium",
                  })}
                </span>
              </div>
            )}

            {type === "assigned" && (
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1.5" />
                <span className="font-medium">Team:</span>
                <span className="ml-1 truncate">{project.teamName}</span>
              </div>
            )}

            {project.tasksIds && (
              <div className="flex items-center">
                <ListChecks className="w-3 h-3 mr-1.5" />
                <span className="font-medium">Tasks:</span>
                <span className="ml-1">{project.tasksIds.length}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button
            size="sm"
            className="ml-auto opacity-0 group-hover:opacity-100 hover:bg-transparent hover:text-fuchsia-400  transition-opacity bg-transparent text-black"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate();
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            Update
          </Button>
        </CardFooter>
      </Card>
    );
  }
);

ProjectCard.displayName = "ProjectCard";

export { ProjectCard };
