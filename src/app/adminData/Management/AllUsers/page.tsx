"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
  UserPlus,
} from "lucide-react";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string;
  userType: string;
  isVerified?: boolean;
}

export default function AllUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedSingleUser, setSelectedSingleUser] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User | null;
    direction: "ascending" | "descending" | null;
  }>({ key: null, direction: null });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmAssignOpen, setConfirmAssignOpen] = useState(false);
  const [confirmSingleDeleteOpen, setConfirmSingleDeleteOpen] = useState(false);
  const [confirmSingleAssignOpen, setConfirmSingleAssignOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/adminData/getAllUsers", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          let errorMsg = `Error: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (e) {
            /* ignore */
          }

          if (response.status === 401 || response.status === 403) {
            toast.error("Unauthorized access. Redirecting to login.");
            router.push("/adminData/LoginAdmin");
          }
          throw new Error(errorMsg);
        }

        const data = await response.json();
        if (data.success) {
          const validUsers = (data.users || []).filter(
            (u: any) => u && u.UserId
          );
          setUsers(validUsers);
          setFilteredUsers(validUsers);
          if (validUsers.length !== (data.users || []).length) {
            console.warn("Some user records were missing a UserId.");
          }
        } else {
          throw new Error(data.message || "Failed to fetch users.");
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error fetching users:", error);
        setError(
          `Failed to fetch users: ${error.message}. Please try again later.`
        );
        toast.error(`Failed to fetch users: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);
  useEffect(() => {
    let result = [...users];

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.firstname.toLowerCase().includes(lowerCaseQuery) ||
          user.lastname.toLowerCase().includes(lowerCaseQuery) ||
          user.email.toLowerCase().includes(lowerCaseQuery) ||
          user.userType.toLowerCase().includes(lowerCaseQuery)
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
  }, [users, searchQuery, sortConfig]);

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

  const handleCheckboxChange = (email: string) => {
    setSelectedUsers((prev) =>
      prev.includes(email)
        ? prev.filter((id) => id !== email)
        : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.email));
    }
  };

  const handleDelete = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user to delete.");
      return;
    }

    setConfirmDeleteOpen(true);
  };
  const handleSingleDelete = async (email: string) => {
    setSelectedSingleUser(email);
    if (selectedSingleUser === "") {
      toast.error("Please select at least one user to delete.");
      return;
    }

    setConfirmSingleDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/adminData/deleteUsers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: selectedUsers }),
      });

      const data = await response.json();
      if (data.success || response.status === 207) {
        toast.success(data.message || "Selected user(s) processed.");
        setUsers((prevUsers) =>
          prevUsers.filter((user) => !selectedUsers.includes(user.email))
        );
        setSelectedUsers([]);

        if (response.status === 207 && data.details?.failedCount > 0) {
          toast.error(
            `Failed to delete ${data.details.failedCount} user(s). Check console.`
          );
          console.error("Deletion Failures:", data.details);
        }
      } else {
        throw new Error(data.message || "Failed to delete users.");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error deleting users:", error);
      toast.error(`Failed to delete users: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setSelectedUsers([]);
      setConfirmDeleteOpen(false);
    }
  };
  const confirmSingleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/adminData/deleteUsers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [selectedSingleUser] }),
      });

      const data = await response.json();
      if (data.success || response.status === 207) {
        toast.success(data.message || "Selected user(s) processed.");
        setUsers((prevUsers) =>
          prevUsers.filter((user) => !selectedUsers.includes(user.email))
        );
        setSelectedSingleUser("");

        if (response.status === 207 && data.details?.failedCount > 0) {
          toast.error(
            `Failed to delete ${data.details.failedCount} user(s). Check console.`
          );
          console.error("Deletion Failures:", data.details);
        }
      } else {
        throw new Error(data.message || "Failed to delete users.");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error deleting users:", error);
      toast.error(`Failed to delete users: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setConfirmSingleDeleteOpen(false);
      setSelectedSingleUser("");
    }
  };
  const handleUpdate = () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user to update.");
      return;
    }
    router.push(
      `/adminData/Management/UpdateUsers?emails=${selectedUsers.join(",")}`
    );
  };
  const handlesingleUpdate = (userId: string) => {
    if (userId === "") {
      toast.error("Please select at least one user to update.");
      return;
    }
    router.push(`/adminData/Management/EditUserProfile/${userId}`);
  };
  const handleAssignProjectManager = () => {
    if (selectedUsers.length === 0) {
      toast.error(
        "Please select at least one user to assign as Project Manager."
      );
      return;
    }

    setConfirmAssignOpen(true);
  };
  const handleAssignSingleProjectManager = (email: string) => {
    setSelectedSingleUser(email);
    if (selectedSingleUser === "") {
      toast.error(
        "Please select at least one user to assign as Project Manager."
      );
      return;
    }

    setConfirmSingleAssignOpen(true);
  };

  const confirmAssignProjectManager = async () => {
    setIsAssigning(true);
    try {
      const response = await fetch("/api/adminData/assignProjectManager", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: selectedUsers }),
      });

      const data = await response.json();
      if (data.success || response.status === 207) {
        toast.success(data.message || "Role assignment processed!");

        const refreshResponse = await fetch("/api/adminData/getAllUsers", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.success) {
            const validUsers = (refreshData.users || []).filter(
              (u: any) => u && u.UserId
            );
            setUsers(validUsers);
            setFilteredUsers(validUsers);
          }
        }

        setSelectedUsers([]);

        if (response.status === 207 && data.details?.failedCount > 0) {
          toast.error(
            `Failed to assign role for ${data.details.failedCount} user(s). Check console.`
          );
          console.error("Assignment Failures:", data.details);
        }
      } else {
        throw new Error(data.message || "Failed to assign role.");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error assigning role:", error);
      toast.error(`Assignment failed: ${error.message}`);
    } finally {
      setIsAssigning(false);
      setConfirmAssignOpen(false);
    }
  };
  const confirmSingleAssignProjectManager = async () => {
    setIsAssigning(true);
    try {
      const response = await fetch("/api/adminData/assignProjectManager", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [selectedSingleUser] }),
      });

      const data = await response.json();
      if (data.success || response.status === 207) {
        toast.success(`${selectedSingleUser} is assigned as project manager`);

        const refreshResponse = await fetch("/api/adminData/getAllUsers", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.success) {
            const validUsers = (refreshData.users || []).filter(
              (u: any) => u && u.UserId
            );
            setUsers(validUsers);
            setFilteredUsers(validUsers);
          }
        }

        setSelectedSingleUser("");

        if (response.status === 207 && data.details?.failedCount > 0) {
          toast.error(
            `Failed to assign role for ${data.details.failedCount} user(s). Check console.`
          );
          console.error("Assignment Failures:", data.details);
        }
      } else {
        throw new Error(data.message || "Failed to assign role.");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error assigning role:", error);
      toast.error(`Assignment failed: ${error.message}`);
    } finally {
      setIsAssigning(false);
      setConfirmAssignOpen(false);
    }
  };
  const handleGoToDetails = (userId: string) => {
    router.push(
      `/adminData/Management/UserDetails/${encodeURIComponent(userId)}`
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="mx-auto max-w-7xl my-8">
        <Card>
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
      </div>
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
                <Users className="mr-2 h-6 w-6" /> All Users Not in a Team
              </CardTitle>
              <CardDescription>
                Manage users who are not currently assigned to any team
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
              <Button
                variant="secondary"
                onClick={handleAssignProjectManager}
                disabled={selectedUsers.length === 0}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Assign PM Role (
                {selectedUsers.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No users found</h3>
              <p className="text-sm text-muted-foreground">
                There are no users without a team in the system.
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
                        onClick={() => requestSort("userType")}
                      >
                        <div className="flex items-center">
                          Role {getSortDirectionIcon("userType")}
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
                            <p>No users match your search</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.UserId} className="group">
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.email)}
                              onCheckedChange={() =>
                                handleCheckboxChange(user.email)
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
                              {user.userType}
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
                                    handlesingleUpdate(user.UserId);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    handleAssignSingleProjectManager(
                                      user.email
                                    );
                                  }}
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Assign PM Role
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    handleSingleDelete(user.email);
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
                Showing {filteredUsers.length} of {users.length} users
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
              user(s)? This action cannot be undone.
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
      <Dialog
        open={confirmSingleDeleteOpen}
        onOpenChange={setConfirmSingleDeleteOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedSingleUser}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmSingleDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmSingleDelete}
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
      <Dialog open={confirmAssignOpen} onOpenChange={setConfirmAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Role Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to assign Project Manager role to{" "}
              {selectedUsers.length} selected user(s)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAssignOpen(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={confirmAssignProjectManager}
              disabled={isAssigning}
            >
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Role
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmSingleAssignOpen}
        onOpenChange={setConfirmSingleAssignOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Role Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to assign Project Manager role to{" "}
              {selectedSingleUser}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmSingleAssignOpen(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={confirmSingleAssignProjectManager}
              disabled={isAssigning}
            >
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Role
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
