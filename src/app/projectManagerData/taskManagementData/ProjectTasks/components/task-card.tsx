"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Clock,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, Member } from "../types";
import { hover } from "framer-motion";

interface TaskCardProps {
  task: Task;
  members: Member[];
  isSelected: boolean;
  isSelectMode: boolean;
  onSelect: (taskId: string) => void;
  onViewImplementation: (task: Task) => void;
  onUpdateTask: (taskId: string, status: string) => void;
}

export function TaskCard({
  task,
  members,
  isSelected,
  isSelectMode,
  onSelect,
  onViewImplementation,
  onUpdateTask,
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get status badge
  const getStatusBadge = () => {
    switch (task.status) {
      case "In Progress":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "Completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "Pending":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "Re Assigned":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            <RotateCcw className="w-3 h-3 mr-1" />
            Re Assigned
          </Badge>
        );
      default:
        return <Badge>{task.status}</Badge>;
    }
  };

  const getBgColor = () => {
    if (isSelected) return "bg-pink-50 border-pink-300";

    switch (task.status) {
      case "In Progress":
        return "bg-blue-50 border-blue-200";
      case "Completed":
        return "bg-green-50 border-green-200";
      case "Pending":
        return "bg-gray-50 border-gray-200";
      case "Re Assigned":
        return "bg-amber-50 border-amber-200";
      default:
        return "";
    }
  };

  const handleClick = () => {
    if (isSelectMode) {
      onSelect(task.TaskId);
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg group relative hover:-translate-y-1",
        getBgColor(),
        isSelectMode ? "cursor-pointer" : "cursor-default"
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2 relative">
        {isSelectMode && (
          <div className="absolute left-2 top-2">
            <Checkbox checked={isSelected} />
          </div>
        )}
        <div className="flex justify-between items-start">
          <CardTitle className={cn("text-lg", isSelectMode && "pl-6")}>
            {task.title}
          </CardTitle>
          <div>{getStatusBadge()}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {task.description}
        </p>

        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          <span>
            {new Date(task.deadline).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center text-xs font-medium">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            <span>Assigned To:</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 pl-5">
            {task.assignedTo.map((userId) => {
              const member = members.find((m) => m.UserId === userId);
              return (
                <li key={userId} className="truncate">
                  {member
                    ? `${member.firstname} ${member.lastname} (${member.email})`
                    : userId}
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-0">
        {(task.status === "In Progress" || task.status === "Completed") && (
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onViewImplementation(task);
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            View Implementation
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "ml-auto",
            !isHovered && "opacity-0",
            isHovered && "opacity-100",
            "transition-opacity",
            "hover:text-fuchsia-400 hover:bg-transparent hover:border hover:border-gray-200"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onUpdateTask(task.TaskId, task.status);
          }}
        >
          <Edit className="w-4 h-4 mr-1" />
          Update
        </Button>
      </CardFooter>
    </Card>
  );
}
