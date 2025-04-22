"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
//TODO:Implement single delete and single updation
import {
  Users,
  Trash2,
  Edit,
  ArrowLeft,
  Search,
  UserCircle,
  Shield,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
} from "lucide-react";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Define User Type
interface User {
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string;
  userType: string;
  UserRole: string;
  UserId: string;
}

export default function AllTeamParticipants() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User | null;
    direction: "ascending" | "descending" | null;
  }>({ key: null, direction: null });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/adminData/getAllTeamParticipants", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          let errorMsg = `Error: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (e) {}

          if (response.status === 401 || response.status === 403) {
            toast.error("Unauthorized access. Redirecting to login.");
            router.push("/adminData/LoginAdmin");
          }
          throw new Error(errorMsg);
        }

        const data = await response.json();
        if (data.success) {
          setUsers(data.participants || []);
          setFilteredUsers(data.participants || []);
        } else {
          throw new Error(data.message || "Failed to fetch Team Participants.");
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error fetching Team Participants:", error);
        setError(
          `Failed to fetch Team Participants: ${error.message}. Please try again later.`
        );
        toast.error(`Failed to fetch Team Participants: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  useEffect(() => {
    let result = [...users];

    if (roleFilter !== "all") {
      result = result.filter((user) => user.UserRole === roleFilter);
    }

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.firstname.toLowerCase().includes(lowerCaseQuery) ||
          user.lastname.toLowerCase().includes(lowerCaseQuery) ||
          user.email.toLowerCase().includes(lowerCaseQuery) ||
          user.UserRole.toLowerCase().includes(lowerCaseQuery)
      );
    }

    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        if (sortConfig.key === "firstname") {
          const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
          const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();

          if (nameA < nameB) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (nameA > nameB) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        }

        if (sortConfig.key) {
          const valueA = String(a[sortConfig.key]).toLowerCase();
          const valueB = String(b[sortConfig.key]).toLowerCase();

          if (valueA < valueB) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (valueA > valueB) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
        }
        return 0;
      });
    }

    setFilteredUsers(result);
  }, [users, searchQuery, sortConfig, roleFilter]);

  const uniqueRoles = Array.from(new Set(users.map((user) => user.UserRole)));

  const requestSort = (key: keyof User) => {
    let direction: "ascending" | "descending" | null = "ascending";

    if (sortConfig.key === key) {
      if (sortConfig.direction === "ascending") {
        direction = "descending";
      } else if (sortConfig.direction === "descending") {
        direction = null;
      }
    }

    setSortConfig({ key, direction });
  };

  const getSortDirectionIcon = (key: keyof User) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const handleCheckboxChange = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.UserId));
    }
  };

  const handleDelete = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one participant to delete.");
      return;
    }

    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    const deleteEndpoint = "/api/adminData/deleteParticipents";

    try {
      const response = await fetch(deleteEndpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedUsers }),
      });

      const data = await response.json();
      if (data.success || response.status === 207) {
        toast.success(data.message || "Selected participant(s) processed.");

        setUsers((prevUsers) =>
          prevUsers.filter((user) => !selectedUsers.includes(user.UserId))
        );
        setSelectedUsers([]);

        if (response.status === 207 && data.details?.failedCount > 0) {
          toast.error(
            `Failed to delete ${data.details.failedCount} participant(s). Check console.`
          );
          console.error(
            "Deletion Failures:",
            data.details.invalidOrSkippedEmails || data.details
          );
        }
      } else {
        throw new Error(data.message || "Failed to delete participants.");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error deleting participants:", error);
      toast.error(`Failed to delete participants: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  const handleUpdate = () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one participant to update.");
      return;
    }
    router.push(`UpdateParticipants?ids=${selectedUsers.join(",")}`);
  };

  const handleGoToDetails = (userId: string) => {
    router.push(`ParticipantDetails/${encodeURIComponent(userId)}`);
  };

  if (loading) {
    return (
      <Card className="mx-auto max-w-7xl my-8">
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl my-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/adminData/Management/ProfileAdmin")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl my-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <Users className="mr-2 h-6 w-6" /> Team Participants
              </CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  router.push("/adminData/Management/ProfileAdmin")
                }
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={selectedUsers.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete (
                {selectedUsers.length})
              </Button>
              <Button
                variant="default"
                onClick={handleUpdate}
                disabled={selectedUsers.length === 0}
              >
                <Edit className="mr-2 h-4 w-4" /> Update ({selectedUsers.length}
                )
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">
                No team participants found
              </h3>
              <p className="text-sm text-muted-foreground">
                There are no team participants in the system yet.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or role..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {uniqueRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            selectedUsers.length === filteredUsers.length &&
                            filteredUsers.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="w-[80px]">Avatar</TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => requestSort("firstname")}
                      >
                        <div className="flex items-center">
                          Name {getSortDirectionIcon("firstname")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => requestSort("email")}
                      >
                        <div className="flex items-center">
                          Email {getSortDirectionIcon("email")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => requestSort("UserRole")}
                      >
                        <div className="flex items-center">
                          Role {getSortDirectionIcon("UserRole")}
                        </div>
                      </TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Search className="h-8 w-8 mb-2" />
                            <p>No participants match your search</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.UserId} className="group">
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.UserId)}
                              onCheckedChange={() =>
                                handleCheckboxChange(user.UserId)
                              }
                              aria-label={`Select ${user.firstname} ${user.lastname}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={user.profilepic || "/default-avatar.png"}
                                alt={`${user.firstname} ${user.lastname}`}
                              />
                              <AvatarFallback>
                                {user.firstname[0]}
                                {user.lastname[0]}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            {user.firstname} {user.lastname}
                          </TableCell>
                          <TableCell
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            onClick={() => handleGoToDetails(user.UserId)}
                          >
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              <Shield className="mr-1 h-3 w-3" />
                              {user.UserRole}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleGoToDetails(user.UserId)}
                                >
                                  <UserCircle className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUsers([user.UserId]);
                                    handleUpdate();
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedUsers([user.UserId]);
                                    handleDelete();
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} participants
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUsers.length} selected
              participant(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
