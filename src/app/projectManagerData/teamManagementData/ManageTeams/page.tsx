"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  UserPlus,
  Trash2,
  Edit,
  PlusCircle,
  CheckSquare,
  XSquare,
  User,
  UserCircle,
  Search,
  X,
  SearchX,
} from "lucide-react";
import { Input } from "@/components/ui/input";

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

interface TeamLeadersData {
  teamId: string;
  teamLeaders: Member[];
}

export default function ShowTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [membersData, setMembersData] = useState<MembersData[]>([]);
  const [teamLeadersData, setTeamLeadersData] = useState<TeamLeadersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          "/api/projectManagerData/teamManagementData/getTeamsData",
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );
        const data = await response.json();
        if (data.success) {
          setTeams(data.teams);
          setMembersData(data.membersData);
          setTeamLeadersData(data.teamLeadersData);
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
    router.push(
      `/projectManagerData/teamManagementData/TeamProjects/${teamId}`
    );
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeamIds((prevSelected) => {
      if (prevSelected.includes(teamId)) {
        return prevSelected.filter((id) => id !== teamId);
      } else {
        return [...prevSelected, teamId];
      }
    });
  };

  const handleToggleSelectMode = () => {
    if (isSelectMode) {
      setSelectedTeamIds([]);
      setIsSelectMode(false);
    } else {
      setIsSelectMode(true);
    }
  };

  const handleDeleteSelectedTeams = async () => {
    try {
      const response = await fetch(
        "/api/projectManagerData/teamManagementData/deleteTeams",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamIds: selectedTeamIds }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Selected teams deleted successfully");
        setTeams((prevTeams) =>
          prevTeams.filter((team) => !selectedTeamIds.includes(team.teamId))
        );
        setSelectedTeamIds([]);
        setIsSelectMode(false);
      } else {
        toast.error(data.message || "Failed to delete teams");
      }
    } catch (err) {
      console.error("Error deleting teams:", err);
      toast.error("Failed to delete teams. Please try again later.");
    }
  };

  const handleEditTeam = () => {
    if (selectedTeamIds.length === 1) {
      router.push(
        `/projectManagerData/teamManagementData/EditTeam/${selectedTeamIds[0]}`
      );
    }
  };

  const handleCreateTeam = () => {
    router.push(`/projectManagerData/teamManagementData/CreateTeam`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-64 mx-auto mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-lg mx-auto text-center">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Teams You Have Created
          </h1>
          <p className="text-gray-500 mt-2">
            Manage your teams and their members
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button onClick={handleCreateTeam}>
            <PlusCircle className="h-4 w-4" />
            Create Team
          </Button>

          <Button
            onClick={handleToggleSelectMode}
            variant={isSelectMode ? "destructive" : "outline"}
            className={isSelectMode ? "bg-pink-600 hover:bg-pink-700" : ""}
          >
            {isSelectMode ? (
              <>
                <XSquare className="mr-2 h-4 w-4" />
                Cancel Selection
              </>
            ) : (
              <>
                <CheckSquare className="mr-2 h-4 w-4" />
                Select Teams
              </>
            )}
          </Button>

          {isSelectMode && selectedTeamIds.length > 0 && (
            <AlertDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedTeamIds.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the selected teams and remove their data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelectedTeams}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {isSelectMode && selectedTeamIds.length === 1 && (
            <Button
              onClick={handleEditTeam}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-300 bg-blue-300"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Team
            </Button>
          )}
        </div>

        <div className="relative mb-6 ">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Projects..."
            className="pl-8 w-[200px] md:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {teams.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-100">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Teams Found
            </h3>
            <p className="text-gray-500 mb-4">
              You haven't created any teams yet.
            </p>
            <Button onClick={handleCreateTeam}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Your First Team
            </Button>
          </div>
        ) : (
          <div>
            {teams.length > 0 &&
              teams.filter((team) =>
                team.teamName.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
                <div className="col-span-full text-center p-12 bg-white rounded-lg shadow-sm border border-gray-100">
                  <SearchX className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Teams Found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    No teams match your search for "{searchQuery}"
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                </div>
              )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams
                .filter((team) =>
                  team.teamName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
                )
                .map((team) => {
                  const teamMembers =
                    membersData.find((data) => data.teamId === team.teamId)
                      ?.members || [];

                  const teamLeaderInfo =
                    teamLeadersData.find((data) => data.teamId === team.teamId)
                      ?.teamLeaders || [];

                  const isSelected =
                    isSelectMode && selectedTeamIds.includes(team.teamId);

                  return (
                    <Card
                      key={team.teamId}
                      className={`overflow-hidden transition-all duration-300 hover:shadow-lg group relative hover:-translate-y-1 cursor-pointer ${
                        isSelected
                          ? "bg-purple-50 border-purple-300 shadow-purple-100"
                          : "hover:border-blue-200"
                      }`}
                      onClick={() =>
                        isSelectMode && toggleTeamSelection(team.teamId)
                      }
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">
                              {team.teamName}
                            </CardTitle>
                            <CardDescription>
                              Created{" "}
                              {new Date(team.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          {isSelectMode && (
                            <div className="h-6 w-6 rounded-full border-2 flex items-center justify-center">
                              {isSelected && (
                                <div className="h-3 w-3 rounded-full bg-purple-600"></div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="mb-4">
                          {teamLeaderInfo.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <UserCircle className="h-4 w-4 mr-1 text-blue-600" />
                                Team Leader
                                {teamLeaderInfo.length > 1 ? "s" : ""}:
                              </h5>
                              <ul className="space-y-2">
                                {teamLeaderInfo.map((leader) => (
                                  <li
                                    key={leader.UserId}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage
                                        src={
                                          leader.profilepic ||
                                          "/placeholder.svg"
                                        }
                                        alt={`${leader.firstname} ${leader.lastname}`}
                                      />
                                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                        {leader.firstname[0]}
                                        {leader.lastname[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">
                                      {leader.firstname} {leader.lastname}
                                    </span>
                                    <span className="text-xs text-gray-500 truncate max-w-[150px]">
                                      {leader.email}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {teamMembers.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <User className="h-4 w-4 mr-1 text-green-600" />
                              Members:
                            </h5>
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                              {teamMembers.map((member) => (
                                <div
                                  key={member.UserId}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage
                                      src={
                                        member.profilepic || "/placeholder.svg"
                                      }
                                      alt={`${member.firstname} ${member.lastname}`}
                                    />
                                    <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                                      {member.firstname[0]}
                                      {member.lastname[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">
                                    {member.firstname} {member.lastname}
                                  </span>
                                  <span className="text-xs text-gray-500 truncate max-w-[150px]">
                                    {member.email}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>

                      {!isSelectMode && (
                        <CardFooter className="pt-0 pb-4">
                          <Button
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 w-full"
                            onClick={() => handleTeamClick(team.teamId)}
                          >
                            View Team Projects
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
