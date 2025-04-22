"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ITeam } from "@/models/Team";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import {
  Briefcase,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  PlusCircle,
} from "lucide-react";

export default function CreateProject() {
  const router = useRouter();

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedAmPm, setSelectedAmPm] = useState("AM");
  const [selectedTeam, setSelectedTeam] = useState<ITeam | null>(null);

  const [teamQuery, setTeamQuery] = useState("");
  const [teamListOpen, setTeamListOpen] = useState(false);

  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(
          "/api/projectManagerData/teamManagementData/getTeams"
        );
        const data = await res.json();
        if (data.success) {
          setTeams(data.teams);
        } else {
          router.push("/userData/LoginUser");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching teams.");
      }
    };
    fetchTeams();
  }, [router]);

  const getFormattedTime = () => {
    let hr = parseInt(selectedHour, 10);
    if (selectedAmPm === "PM" && hr !== 12) hr += 12;
    if (selectedAmPm === "AM" && hr === 12) hr = 0;
    return `${hr.toString().padStart(2, "0")}:${selectedMinute}:00`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!title || !description) {
      setError("Please fill in all fields.");
      toast.error("Please fill in all fields.");
      setLoading(false);
      return;
    }

    let combinedDeadline: Date | null = null;
    if (selectedTeam) {
      if (!deadlineDate) {
        setError(
          "Please fill in the deadline details when assigning to a team."
        );
        toast.error(
          "Please fill in the deadline details when assigning to a team."
        );
        setLoading(false);
        return;
      }
      combinedDeadline = new Date(`${deadlineDate}T${getFormattedTime()}`);
      if (isNaN(combinedDeadline.getTime())) {
        setError("Invalid date/time selection.");
        toast.error("Invalid date/time selection.");
        setLoading(false);
        return;
      }
      if (combinedDeadline <= new Date()) {
        setError("Please select a future deadline.");
        toast.error("Please select a future deadline.");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(
        "/api/projectManagerData/projectManagementData/createProject",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            deadline: combinedDeadline ? combinedDeadline.toISOString() : null,
            assignedTeam: selectedTeam,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(
          selectedTeam
            ? "Project created and team assigned!"
            : "Project created without assignment!"
        );
        router.back();
      } else {
        setError(data.message);
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to create project. Please try again.");
      toast.error("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Project
          </CardTitle>
          <CardDescription>
            Fill in details and optionally assign to a team
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-1">
              <Label htmlFor="title" className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4" />
                Project Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter project title"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="description" className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4" />
                Project Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter project description"
                rows={4}
              />
            </div>

            <div className="space-y-1">
              <Label className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Assign to a Team (Optional)
              </Label>

              <div className="relative">
                <Input
                  placeholder="Search and select a team"
                  value={teamQuery}
                  onChange={(e) => {
                    setTeamQuery(e.target.value);
                    setSelectedTeam(null);
                    setTeamListOpen(true);
                  }}
                  onFocus={() => setTeamListOpen(true)}
                  onBlur={() => {
                    setTimeout(() => setTeamListOpen(false), 150);
                  }}
                  className="w-full"
                  autoComplete="off"
                />

                {teamListOpen && (
                  <ul
                    className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 
                   border border-gray-200 dark:border-gray-700 
                   rounded-md shadow-lg max-h-60 overflow-auto"
                  >
                    {teams
                      .filter((team) =>
                        team.teamName
                          .toLowerCase()
                          .includes(teamQuery.toLowerCase())
                      )
                      .map((team) => (
                        <li
                          key={team.teamId}
                          className="flex items-center px-3 py-2 cursor-pointer 
                         hover:bg-gray-100 dark:hover:bg-gray-700"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedTeam(team);
                            setTeamQuery(team.teamName);
                            setTeamListOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTeam?.teamId === team.teamId
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <span>{team.teamName}</span>
                        </li>
                      ))}
                    {teams.filter((t) =>
                      t.teamName.toLowerCase().includes(teamQuery.toLowerCase())
                    ).length === 0 && (
                      <li className="px-3 py-2 text-sm text-gray-500">
                        No teams found.
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            {selectedTeam && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="deadline-date" className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Deadline Date
                  </Label>
                  <Input
                    id="deadline-date"
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
                    <Select
                      onValueChange={setSelectedHour}
                      defaultValue={selectedHour}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (h) => (
                            <SelectItem
                              key={h}
                              value={h.toString().padStart(2, "0")}
                            >
                              {h}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    <Select
                      onValueChange={setSelectedMinute}
                      defaultValue={selectedMinute}
                    >
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

                    <Select
                      onValueChange={setSelectedAmPm}
                      defaultValue={selectedAmPm}
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
              </>
            )}
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <Button
            onClick={(e) => handleSubmit(e as any)}
            className="w-full"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Project"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
