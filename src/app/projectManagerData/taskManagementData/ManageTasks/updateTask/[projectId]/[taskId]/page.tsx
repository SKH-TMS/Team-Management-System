"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import {
  Edit2,
  Users,
  Calendar,
  Clock,
  XCircle,
  GitBranch,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

export default function UpdateTaskPage() {
  const { projectId, taskId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [task, setTask] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [deadlineDate, setDeadlineDate] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("10");
  const [ampm, setAmPm] = useState<"AM" | "PM">("AM");
  const [assignedTo, setAssignedTo] = useState<string>("__none");

  useEffect(() => {
    async function fetchTask() {
      try {
        const res = await fetch(
          `/api/projectManagerData/taskManagementData/getTaskDetails/${taskId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          }
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setTask(data.task);
        setMembers(data.members);

        setTitle(data.task.title);
        setDescription(data.task.description);

        setDeadlineDate(
          new Date(data.task.deadline).toISOString().split("T")[0]
        );
        const d = new Date(data.task.deadline);
        const hrs = d.getHours();
        setAmPm(hrs >= 12 ? "PM" : "AM");
        const hr12 = hrs % 12 || 12;
        setHour(String(hr12).padStart(2, "0"));
        setMinute(String(d.getMinutes()).padStart(2, "0"));

        setAssignedTo(data.task.assignedTo?.[0] ?? "");
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load task.");
        toast.error(e.message || "Failed to load task.");
        router.push("/userData/ProfileUser");
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [projectId, taskId, router]);

  const getFormattedTime = () => {
    let h = parseInt(hour);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minute}:00`;
  };

  const handleSubmit = async () => {
    const combined = new Date(`${deadlineDate}T${getFormattedTime()}`);
    if (isNaN(combined.getTime())) {
      return toast.error("Invalid date/time.");
    }
    try {
      const res = await fetch(
        "/api/projectManagerData/taskManagementData/updateTask",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            title,
            description,
            assignedTo: assignedTo ? [assignedTo] : [],
            deadline: combined.toISOString(),
            gitHubUrl: task.gitHubUrl,
            context: task.context,
          }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Task updated!");
      router.back();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Update failed.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 container mx-auto">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-24 w-full mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 container mx-auto">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Edit2 className="mr-2 h-5 w-5" />
            Update Task
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title" className="flex items-center">
              <ClipboardList className="mr-2 h-4 w-4" />
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="desc" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              Description
            </Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              rows={4}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="assign" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Assign To
            </Label>
            <Select
              onValueChange={(val) => {
                setAssignedTo(val === "__none" ? "" : val);
              }}
              defaultValue={assignedTo || "__none"}
            >
              <SelectTrigger id="assign">
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">All Members</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.UserId} value={m.UserId}>
                    {m.firstname} {m.lastname} — {m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="date" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Deadline Date
            </Label>
            <Input
              id="date"
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Deadline Time
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Select onValueChange={setHour} defaultValue={hour}>
                <SelectTrigger>
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <SelectItem key={h} value={h.toString().padStart(2, "0")}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={setMinute} defaultValue={minute}>
                <SelectTrigger>
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent>
                  {["00", "15", "30", "45"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(v) => setAmPm(v as "AM" | "PM")}
                defaultValue={ampm}
              >
                <SelectTrigger>
                  <SelectValue placeholder="AM/PM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {task.submittedby !== "Not-submitted" && (
            <>
              <Separator />

              <div className="space-y-1">
                <Label className="flex items-center">
                  <GitBranch className="mr-2 h-4 w-4" />
                  GitHub URL
                </Label>
                <Input
                  value={task.gitHubUrl || ""}
                  onChange={(e) =>
                    setTask({ ...task, gitHubUrl: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Explanation
                </Label>
                <Textarea
                  value={task.context || ""}
                  onChange={(e) =>
                    setTask({ ...task, context: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </>
          )}

          {task.status === "Re Assigned" && (
            <div className="space-y-1">
              <Label className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                Feedback
              </Label>
              <Textarea
                value={task.context || ""}
                onChange={(e) => setTask({ ...task, context: e.target.value })}
                rows={3}
              />
            </div>
          )}
        </CardContent>

        <Card>
          <CardFooter className="flex justify-end space-x-2">
            <Button onClick={handleSubmit}>Update Task</Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </Card>
    </div>
  );
}
