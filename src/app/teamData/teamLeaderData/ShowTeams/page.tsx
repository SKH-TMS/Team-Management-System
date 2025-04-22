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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, ChevronRight, Eye, Search } from "lucide-react";

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
  profilepic: string;
  email: string;
}

interface MembersData {
  teamId: string;
  members: Member[];
}

export default function ShowTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [membersData, setMembersData] = useState<MembersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teamData/teamLeaderData/getTeams", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (data.success) {
          setTeams(data.teams);
          setMembersData(data.membersData);
        } else {
          setError(data.message || "Failed to fetch teams");
          toast.error(data.message || "Failed to fetch teams");
          router.push("/teamData/ProfileTeam");
        }
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError("Failed to fetch teams. Please try again later.");
        toast.error("Failed to fetch teams. Please try again later.");
        router.push("/teamData/ProfileTeam");
      }
      setLoading(false);
    };

    fetchTeams();
  }, [router]);

  const handleTeamClick = (teamId: string) => {
    router.push(`/teamData/teamLeaderData/TeamProjects/${teamId}`);
  };

  const filteredTeams = teams.filter((team) => {
    const query = searchQuery.toLowerCase();

    if (team.teamName.toLowerCase().includes(query)) {
      return true;
    }

    const teamMemberData = membersData.find(
      (data) => data.teamId === team.teamId
    );
    if (teamMemberData) {
      return teamMemberData.members.some(
        (member) =>
          member.firstname.toLowerCase().includes(query) ||
          member.lastname.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query)
      );
    }

    return false;
  });

  if (loading) {
    return (
      <div className="w-full p-3 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4 mb-2" />
            </CardHeader>
            <CardContent className="pb-2">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-4 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-3 sm:p-6">
        <Alert variant="destructive">
          <AlertTitle>Error loading teams</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full p-3 sm:p-6 space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          Teams You Lead
        </h1>

        {/* Search Bar */}
        <div className="relative mx-auto mb-4 sm:mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search teams or members..."
            className="pl-10 w-full bg-white text-sm sm:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredTeams.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <p>No teams found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTeams.map((team) => {
              const teamMembers = membersData.find(
                (data) => data.teamId === team.teamId
              )?.members;

              return (
                <Card
                  key={team.teamId}
                  className="relative overflow-hidden group hover:shadow-2xl transform hover:-translate-y-1 transition duration-300 bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm  p-4"
                  onClick={() => handleTeamClick(team.teamId)}
                >
                  <div className="absolute right-3 top-3">
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>

                  <CardHeader className="pb-2 pr-8">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-gray-500" />
                      <CardTitle className="text-lg truncate">
                        {team.teamName}
                      </CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 text-sm text-gray-600 pb-2">
                    <p>
                      <strong>Members:</strong> {team.members.length}
                    </p>
                    {teamMembers && teamMembers.length > 0 && (
                      <>
                        <Separator />
                        <div className="flex space-x-1">
                          {teamMembers.slice(0, 3).map((member) => (
                            <Tooltip key={member.UserId}>
                              <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 ring-2 ring-white">
                                  <AvatarImage src={member.profilepic} />
                                  <AvatarFallback>
                                    {member.firstname[0]}
                                    {member.lastname[0]}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="bg-gradient-to-br from-slate-50 to-slate-100 text-black"
                              >
                                <p className="text-sm">
                                  {member.firstname} {member.lastname} <br />
                                  {member.email}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {teamMembers.length > 3 && (
                            <Badge className="ml-2">
                              +{teamMembers.length - 3}
                            </Badge>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>

                  <CardFooter className="flex justify-between items-center pb-3 pt-2">
                    <Badge variant="secondary" className="text-xs">
                      Leader{team.teamLeader.length > 1 ? "s" : ""}:{" "}
                      {team.teamLeader.length}
                    </Badge>
                    <span className="text-xs text-gray-600">
                      Created{" "}
                      {new Date(team.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </CardFooter>

                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-200/80 to-transparent py-2 px-4 
                    flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 
                    transition-opacity cursor-pointer hover:bg-transparent hover:text-black"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs sm:text-sm flex items-center justify-center text-gray-700 hover:bg-transparent hover:text-black pt-4 "
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTeamClick(team.teamId);
                      }}
                    >
                      <Eye className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span>View Projects</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
