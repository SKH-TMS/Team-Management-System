"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Users, ChevronRight, Eye } from "lucide-react";

interface Team {
  teamId: string;
  teamName: string;
  teamLeader: string[];
  members: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string;
}

interface MembersData {
  teamId: string;
  members: Member[];
}

export default function ManageTask() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [membersData, setMembersData] = useState<MembersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch(
          "/api/teamData/teamMemberData/getTeamsforMembers"
        );
        const data = await res.json();
        if (data.success) {
          setTeams(data.teams);
          setMembersData(data.membersData);
        } else {
          throw new Error(data.message || "Failed to fetch teams");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        toast.error(err.message);
        router.push("/teamData/ProfileTeam");
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, [router]);

  const handleTeamClick = (teamId: string) =>
    router.push(`/teamData/teamMemberData/TeamProjects/${teamId}`);

  if (loading) {
    return (
      <div
        className="container mx-auto px-4 py-6 sm:px-6 grid grid-cols-1
                      sm:grid-cols-2 md:grid-cols-3 gap-6"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6">
        <Alert variant="destructive">
          <AlertTitle>Error loading teams</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-6 sm:px-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          You're a member of these Teams
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {teams.map((team) => {
            const members = membersData.find(
              (m) => m.teamId === team.teamId
            )?.members;

            return (
              <Card
                key={team.teamId}
                className="relative overflow-hidden group hover:shadow-2xl
                           transform hover:-translate-y-1 transition
                           duration-300 bg-gradient-to-br
                           from-slate-50 to-slate-100"
              >
                <CardHeader className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <CardTitle className="text-lg">{team.teamName}</CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </CardHeader>

                <CardContent
                  className="space-y-2 text-xs sm:text-sm
                                        text-gray-600 p-4"
                >
                  <p>
                    <strong>Members:</strong> {team.members.length}
                  </p>
                  {members && members.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex space-x-1">
                        {members.slice(0, 3).map((m) => (
                          <Tooltip key={m.UserId}>
                            <TooltipTrigger asChild>
                              <Avatar
                                className="h-6 w-6 sm:h-8 sm:w-8
                                           ring-2 ring-white"
                              >
                                <AvatarImage src={m.profilepic} />
                                <AvatarFallback>
                                  {m.firstname[0]}
                                  {m.lastname[0]}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="bg-gradient-to-br
                                         from-slate-50 to-slate-100
                                         text-black"
                            >
                              <p className="text-sm">
                                {m.firstname} {m.lastname} <br />
                                {m.email}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {members.length > 3 && (
                          <Badge className="ml-2">+{members.length - 3}</Badge>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>

                <CardFooter
                  className="flex flex-col sm:flex-row
                                       justify-between items-center
                                       p-4 space-y-2 sm:space-y-0"
                >
                  <div
                    className="flex items-center space-x-4 w-full
                                  sm:w-auto justify-between sm:justify-start pb-6"
                  >
                    <Badge variant="secondary" className="text-xs">
                      Leader: {team.teamLeader.length}
                    </Badge>
                    <span className="text-xs text-gray-600">
                      Created{" "}
                      {new Date(team.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <button
                    className="block sm:hidden text-sm text-blue-600
                               hover:underline"
                    onClick={() => handleTeamClick(team.teamId)}
                  >
                    View Projects
                  </button>
                </CardFooter>

                <div
                  className=" sm:flex absolute bottom-0 left-0 right-0
                             text-black py-2 px-4 flex items-center
                             justify-center opacity-0 group-hover:opacity-100
                             transition-opacity cursor-pointer"
                  onClick={() => handleTeamClick(team.teamId)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  <span className="text-sm">View Projects</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
