"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

import { IUser } from "@/models/User";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { Edit2, Users, UserCheck, XCircle } from "lucide-react";

interface TeamData {
  teamId: string;
  teamName: string;
  teamLeader: string[];
  members: string[];
}

export default function EditTeam() {
  const router = useRouter();
  const { teamId } = useParams() as { teamId: string };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [users, setUsers] = useState<IUser[]>([]);
  const [teamName, setTeamName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<
    { email: string; userId: string }[]
  >([]);
  const [teamLeader, setTeamLeader] = useState<{
    email: string;
    userId: string;
  } | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch(
          "/api/projectManagerData/teamManagementData/getAllUsers"
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setUsers(data.users);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to fetch users.");
        toast.error(e.message || "Failed to fetch users.");
        router.push("/userData/LoginUser");
      }
    }
    loadUsers();
  }, [router]);

  useEffect(() => {
    if (!users.length) return;

    async function loadTeam() {
      try {
        const res = await fetch(
          `/api/projectManagerData/teamManagementData/getTeamData/${teamId}`
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const team: TeamData = data.team;
        setTeamName(team.teamName);

        const leaderId = Array.isArray(team.teamLeader)
          ? team.teamLeader[0]
          : team.teamLeader;
        const leader = users.find((u) => u.UserId === leaderId);
        if (leader) {
          setTeamLeader({ email: leader.email, userId: leader.UserId });
        }

        const memberList = team.members
          .map((id) => users.find((u) => u.UserId === id))
          .filter(Boolean)
          .map((u) => ({ email: u!.email, userId: u!.UserId }));

        if (leader && !memberList.some((m) => m.userId === leader.UserId)) {
          memberList.push({ email: leader.email, userId: leader.UserId });
        }

        setSelectedMembers(memberList);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to fetch team data.");
        toast.error(e.message || "Failed to fetch team data.");
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, [teamId, users, router]);

  const handleCheckboxChange = (email: string, userId: string) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m.email === email)
        ? prev.filter((m) => m.email !== email)
        : [...prev, { email, userId }]
    );
  };

  const handleSave = async () => {
    if (!teamName || !selectedMembers.length || !teamLeader) {
      return toast.error(
        "Please fill all fields, select members and a leader."
      );
    }

    const filtered = selectedMembers.filter(
      (m) => m.userId !== teamLeader.userId
    );

    try {
      const res = await fetch(
        `/api/projectManagerData/teamManagementData/editTeam/${teamId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamName,
            teamLeader,
            members: filtered,
          }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Team updated!");
      router.push("/projectManagerData/teamManagementData/ManageTeams");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update team.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 container mx-auto">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
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
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Edit2 className="mr-2 h-5 w-5" />
            Edit Team
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Team Name */}
          <div className="space-y-1">
            <Label htmlFor="team-name" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Team Name
            </Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
            />
          </div>

          <div className="space-y-1">
            <Label className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Team Members
            </Label>
            <div className="border rounded p-2 max-h-48 overflow-auto">
              {users.map((u) => (
                <label
                  key={u.UserId}
                  className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded"
                >
                  <Checkbox
                    checked={selectedMembers.some((m) => m.userId === u.UserId)}
                    onCheckedChange={() =>
                      handleCheckboxChange(u.email, u.UserId)
                    }
                  />
                  <span>
                    {u.firstname} {u.lastname} ({u.email})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="flex items-center">
              <UserCheck className="mr-2 h-4 w-4" />
              Team Leader
            </Label>
            <Select
              value={teamLeader?.userId || ""}
              onValueChange={(val) => {
                const sel = selectedMembers.find((m) => m.userId === val);
                if (sel) setTeamLeader(sel);
              }}
              disabled={!selectedMembers.length}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a leader" />
              </SelectTrigger>
              <SelectContent>
                {selectedMembers.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
