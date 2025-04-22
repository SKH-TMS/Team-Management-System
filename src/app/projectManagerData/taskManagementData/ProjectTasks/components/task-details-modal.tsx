"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { CheckCircle, Copy, AlertTriangle, Github, User } from "lucide-react";
import type { Task, Member } from "../types";

interface TaskDetailsModalProps {
  task: Task | null;
  submitters: Member[];
  isOpen: boolean;
  onClose: () => void;
  onMarkCompleted: () => void;
  onMarkPending: (feedback: string) => void;
  onCopyToClipboard: (text: string) => void;
}

export function TaskDetailsModal({
  task,
  submitters,
  isOpen,
  onClose,
  onMarkCompleted,
  onMarkPending,
  onCopyToClipboard,
}: TaskDetailsModalProps) {
  const [isPendingMode, setIsPendingMode] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleMarkPendingClick = () => {
    setIsPendingMode(true);
  };

  const handleConfirmPending = () => {
    if (feedback.trim() === "") {
      return;
    }
    onMarkPending(feedback);
    setIsPendingMode(false);
    setFeedback("");
  };

  const handleClose = () => {
    setIsPendingMode(false);
    setFeedback("");
    onClose();
  };

  const submitter = task?.submittedby
    ? submitters.find((s) => s.UserId === task.submittedby)
    : null;

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {task.status === "Completed"
              ? "Completed Task"
              : "Task Implementation"}
          </DialogTitle>
          <DialogDescription>
            Review the implementation details for this task.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label className="flex items-center text-sm font-medium">
            <User className="w-4 h-4 mr-1.5" />
            Submitted By
          </Label>
          <div className="text-sm text-muted-foreground">
            {submitter
              ? `${submitter.firstname} ${submitter.lastname} (${submitter.email})`
              : "Not submitted yet"}
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          <Label className="flex items-center text-sm font-medium">
            <Github className="w-4 h-4 mr-1.5" />
            GitHub URL
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              value={task.gitHubUrl || ""}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopyToClipboard(task.gitHubUrl || "")}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isPendingMode ? (
          <div className="space-y-1">
            <Label className="flex items-center text-sm font-medium">
              <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-500" />
              Feedback for Rejection
            </Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Please provide feedback on why this task is being marked as pending..."
              className="min-h-[120px]"
            />
            {feedback.trim() === "" && (
              <p className="text-xs text-red-500">Feedback is required</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="flex items-center text-sm font-medium">
              Implementation Details
            </Label>
            <Textarea
              value={task.context || "No explanation provided"}
              readOnly
              className="min-h-[120px]"
            />
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {task.status === "In Progress" && (
            <>
              {isPendingMode ? (
                <Button
                  variant="destructive"
                  onClick={handleConfirmPending}
                  disabled={feedback.trim() === ""}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Confirm Rejection
                </Button>
              ) : (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleMarkPendingClick}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Mark as Pending
                  </Button>
                  <Button variant="default" onClick={onMarkCompleted}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </Button>
                </>
              )}
            </>
          )}

          {task.status === "Completed" && (
            <>
              {isPendingMode ? (
                <Button
                  variant="destructive"
                  onClick={handleConfirmPending}
                  disabled={feedback.trim() === ""}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Confirm Rejection
                </Button>
              ) : (
                <Button variant="destructive" onClick={handleMarkPendingClick}>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Mark as Pending
                </Button>
              )}
            </>
          )}

          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
