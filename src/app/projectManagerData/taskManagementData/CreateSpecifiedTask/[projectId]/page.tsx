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
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  ClipboardList,
  Users,
  Calendar,
  Clock,
  Check,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string;
}

export default function CreateSpecifiedTaskPage() {
  const { projectId } = useParams();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");

  const [members, setMembers] = useState<Member[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberListOpen, setMemberListOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | "">("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(
      `/api/projectManagerData/taskManagementData/getTeamMembers/${projectId}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setMembers(d.membersData);
        } else {
          throw new Error(d.message);
        }
      })
      .catch((e: any) => {
        console.error(e);
        toast.error(e.message || "Failed to fetch members.");
        router.back();
      })
      .finally(() => setLoading(false));
  }, [projectId, router]);

  const selectedMember = members.find((m) => m.UserId === selectedMemberId);
  const selectedMemberName = selectedMember
    ? `${selectedMember.firstname} ${selectedMember.lastname}`
    : "";

  const getFormattedTime = () => {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${minute}:00`;
  };

  const handleTaskAssign = async () => {
    if (!deadlineDate || !title || !description) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");

    const combined = new Date(`${deadlineDate}T${getFormattedTime()}`);
    if (isNaN(combined.getTime())) {
      toast.error("Invalid date/time.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/projectManagerData/taskManagementData/createSpecificTask`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            title,
            description,
            assignedTo: selectedMemberId ? [selectedMemberId] : [],
            deadline: combined.toISOString(),
          }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Task assigned successfully!");
      router.push(
        `/projectManagerData/taskManagementData/ProjectTasks/${projectId}`
      );
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to assign task.");
      toast.error(e.message || "Failed to assign task.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 container mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="mr-2 h-5 w-5" />
            Create Task
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <Label htmlFor="task-title" className="flex items-center">
              <Check className="mr-2 h-4 w-4" />
              Task Title
            </Label>
            <Input
              id="task-title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="task-desc" className="flex items-center">
              <ClipboardList className="mr-2 h-4 w-4" />
              Description
            </Label>
            <Textarea
              id="task-desc"
              placeholder="Enter task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-1">
            <Label className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Assign To
            </Label>
            <div className="relative">
              <Input
                placeholder="Search and select a member"
                value={selectedMemberName || memberQuery}
                onChange={(e) => {
                  setMemberQuery(e.target.value);
                  setSelectedMemberId("");
                  setMemberListOpen(true);
                }}
                onFocus={() => setMemberListOpen(true)}
                onBlur={() => setTimeout(() => setMemberListOpen(false), 150)}
                autoComplete="off"
              />
              {memberListOpen && (
                <ul
                  className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800
                             border border-gray-200 dark:border-gray-700
                             rounded-md shadow-lg max-h-60 overflow-auto"
                >
                  <li
                    className={cn(
                      "px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                      !selectedMemberId && "font-medium"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedMemberId("");
                      setMemberQuery("");
                      setMemberListOpen(false);
                    }}
                  >
                    All Members
                  </li>

                  {members
                    .filter((m) =>
                      `${m.firstname} ${m.lastname}`
                        .toLowerCase()
                        .includes(memberQuery.toLowerCase())
                    )
                    .map((m) => {
                      const fullName = `${m.firstname} ${m.lastname}`;
                      return (
                        <li
                          key={m.UserId}
                          className={cn(
                            "flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                            selectedMemberId === m.UserId
                              ? "bg-gray-100 dark:bg-gray-700 font-medium"
                              : ""
                          )}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedMemberId(m.UserId);
                            setMemberQuery(fullName);
                            setMemberListOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedMemberId === m.UserId
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {fullName} – {m.email}
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Deadline Date
            </Label>
            <Input
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
                  <SelectValue placeholder="Minute" />
                </SelectTrigger>
                <SelectContent>
                  {["00", "15", "30", "45"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={setAmPm} defaultValue={ampm}>
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <Button
            onClick={handleTaskAssign}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Assigning…" : "Assign Task"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
