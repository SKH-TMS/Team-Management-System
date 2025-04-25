// src/app/projectManagerData/taskManagementData/ProjectTasks/components/task-card.tsx
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
  // Users, // Removed Users icon
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task /*, Member */ } from "../types"; // Removed Member import if not used elsewhere in this file
// Removed framer-motion import as hover wasn't used

// --- CHANGE 1: Remove 'members' from props interface ---
interface TaskCardProps {
  task: Task;
  // members: Member[]; // Removed this line
  isSelected: boolean;
  isSelectMode: boolean;
  onSelect: (taskId: string) => void;
  onViewImplementation: (task: Task) => void;
  onUpdateTask: (taskId: string /*, status: string */) => void; // Removed status if not needed by handler
}

export function TaskCard({
  task,
  // members, // --- CHANGE 2: Remove 'members' from destructuring ---
  isSelected,
  isSelectMode,
  onSelect,
  onViewImplementation,
  onUpdateTask,
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get status badge (logic remains the same)
  const getStatusBadge = () => {
    switch (task.status) {
      case "In Progress":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5"
          >
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "Completed":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "Pending":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "Re Assigned":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Re Assigned
          </Badge>
        );
      default:
        return <Badge className="text-xs px-1.5 py-0.5">{task.status}</Badge>;
    }
  };

  // Get background color (logic remains the same)
  const getBgColor = () => {
    if (isSelected) return "ring-2 ring-primary shadow-md"; // Use ring for selection

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
        return "bg-card border"; // Default card background and border
    }
  };

  const handleClick = () => {
    if (isSelectMode) {
      onSelect(task.TaskId);
    }
    // Optionally navigate to task details if not in select mode
    // else { router.push(`/tasks/${task.TaskId}`); }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200 group relative border", // Added base border
        getBgColor(),
        isSelectMode
          ? "cursor-pointer hover:shadow-lg"
          : "hover:shadow-md hover:-translate-y-0.5" // Adjusted hover effects
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2 relative">
        {isSelectMode && (
          <div className="absolute left-3 top-3 z-10">
            {" "}
            {/* Adjusted position */}
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(task.TaskId)} // Allow clicking checkbox directly
              aria-label={`Select task ${task.title}`}
            />
          </div>
        )}
        <div className="flex justify-between items-start gap-2">
          <CardTitle
            className={cn(
              "text-base sm:text-lg font-medium line-clamp-2 break-words",
              isSelectMode && "pl-8"
            )}
          >
            {" "}
            {/* Adjusted padding */}
            {task.title}
          </CardTitle>
          <div className="flex-shrink-0">{getStatusBadge()}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-3 text-sm">
        {" "}
        {/* Adjusted spacing */}
        <p className="text-muted-foreground line-clamp-3">
          {" "}
          {/* Increased line clamp */}
          {task.description}
        </p>
        <div className="flex items-center text-xs text-muted-foreground pt-1">
          <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
          <span className="truncate">
            Due:{" "}
            {new Date(task.deadline).toLocaleString("en-US", {
              // Slightly shorter format for card
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        {/* --- CHANGE 3: Remove the "Assigned To" section --- */}
        {/*
        <div className="space-y-1 pt-1">
          <div className="flex items-center text-xs font-medium">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            <span>Assigned To:</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 pl-5 max-h-16 overflow-y-auto">
            {task.assignedTo?.map((userId) => { // Added optional chaining just in case
              const member = members.find((m) => m.UserId === userId);
              return (
                <li key={userId} className="truncate">
                  {member
                    ? `${member.firstname} ${member.lastname}` // Simplified display
                    : `User ID: ${userId}`}
                </li>
              );
            })}
             {(!task.assignedTo || task.assignedTo.length === 0) && (
                 <li className="italic text-gray-400">Team Assigned</li>
             )}
          </ul>
        </div>
        */}
        {/* --- End of Removed Section --- */}
      </CardContent>

      <CardFooter className="pt-2 pb-3 flex justify-end items-center gap-1">
        {" "}
        {/* Adjusted padding/gap */}
        {/* View Implementation Button */}
        {(task.status === "In Progress" || task.status === "Completed") && (
          <Button
            variant="link" // Use link for less emphasis
            size="sm"
            className="text-primary hover:text-primary/80 p-1 h-auto text-xs mr-auto" // Adjusted styling
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              onViewImplementation(task);
            }}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            View Details
          </Button>
        )}
        {/* Update Button (conditionally visible) */}
        {!isSelectMode && (
          <Button
            variant="ghost"
            size="icon" // Use icon button for less space
            className={cn(
              "h-7 w-7 rounded-full", // Make it round
              "opacity-0 group-hover:opacity-100 focus-visible:opacity-100", // Control visibility
              "transition-opacity duration-200",
              "hover:bg-accent"
            )}
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              onUpdateTask(task.TaskId /*, task.status */); // Pass only taskId
            }}
            aria-label="Update Task"
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
