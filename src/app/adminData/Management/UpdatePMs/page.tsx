"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import {
  Users,
  User,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface UserType {
  UserId: string;
  email: string;
  firstname: string;
  lastname: string;
  contact: string;
  password?: string;
  UserRole?: string;
}

function UpdateProjectManagersInner() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>(
    {}
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  const userIds = searchParams.get("ids")?.split(",") || [];

  const emails = searchParams.get("emails")?.split(",") || [];

  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchById = userIds.length > 0;
      const identifiers = fetchById ? userIds : emails;
      const endpoint = fetchById
        ? "/api/adminData/getUsersById"
        : "/api/adminData/getUsersByEmail";

      if (identifiers.length === 0 || hasFetched.current) return;

      setLoading(true);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            fetchById ? { ids: identifiers } : { emails: identifiers }
          ),
        });

        const data = await response.json();

        if (data.success) {
          const usersWithPasswordField = data.users.map((user: any) => ({
            ...user,
            password: "",
          }));
          setUsers(usersWithPasswordField);
        } else if (response.status === 403) {
          router.push("/adminData/LoginAdmin");
        } else {
          setError(data.message || "Failed to fetch users.");
          toast.error(data.message || "Failed to fetch users.");
        }
      } catch (err) {
        const error = err as Error;
        setError(`Failed to fetch users: ${error.message}`);
        toast.error(`Failed to fetch users: ${error.message}`);
      } finally {
        setLoading(false);
        hasFetched.current = true;
      }
    };

    fetchUsers();
  }, [emails, router, userIds]);

  const handleInputChange = (
    index: number,
    field: keyof Omit<UserType, "UserId">,
    value: string
  ) => {
    setUsers((prevUsers) =>
      prevUsers.map((user, i) =>
        i === index ? { ...user, [field]: value } : user
      )
    );
  };

  const togglePasswordVisibility = (index: number) => {
    setShowPasswords((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleUpdate = async () => {
    if (users.length === 0) {
      toast.error("No project managers selected to update.");
      return;
    }

    const updatesPayload = users.map((user) => {
      const updateData: Partial<UserType> & { UserId: string } = {
        UserId: user.UserId,
        firstname: user.firstname,
        lastname: user.lastname,
        contact: user.contact,
      };

      if (user.password && user.password.trim() !== "") {
        updateData.password = user.password;
      }
      return updateData;
    });

    try {
      setSubmitting(true);
      const response = await fetch("/api/adminData/updateUsers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: updatesPayload }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Project managers updated successfully!");
        router.push("/adminData/Management/AllProjectManagers");
      } else {
        toast.error(`Failed to update project managers: ${data.message}`);
      }
    } catch (err) {
      const error = err as Error;
      toast.error(`Failed to update project managers: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-40" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <Users className="mr-2 h-6 w-6" /> Update Project Managers
              </CardTitle>
              <CardDescription>
                Update information for {users.length} selected project manager
                {users.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {users.length === 0 && !loading ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">
                No project managers selected
              </h3>
              <p className="text-sm text-muted-foreground">
                No project managers were selected or found to update.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.back()}
              >
                Go Back
              </Button>
            </div>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={users.map((_, i) => `item-${i}`)}
            >
              {users.map((user, index) => (
                <AccordionItem
                  key={user.UserId}
                  value={`item-${index}`}
                  className="border rounded-lg px-2 mb-4"
                >
                  <AccordionTrigger className="py-4 hover:no-underline">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-left">
                      <span className="font-medium">
                        {user.firstname} {user.lastname}
                      </span>
                      <Badge variant="outline" className="sm:ml-2">
                        <Mail className="mr-1 h-3 w-3" />
                        {user.email}
                      </Badge>
                      {user.UserRole && (
                        <Badge variant="secondary" className="sm:ml-2">
                          {user.UserRole}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-2">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`firstname-${index}`}>
                            First Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id={`firstname-${index}`}
                              value={user.firstname}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "firstname",
                                  e.target.value
                                )
                              }
                              className="pl-8"
                              placeholder="First Name"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`lastname-${index}`}>Last Name</Label>
                          <div className="relative">
                            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id={`lastname-${index}`}
                              value={user.lastname}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "lastname",
                                  e.target.value
                                )
                              }
                              className="pl-8"
                              placeholder="Last Name"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`contact-${index}`}>
                          Contact Number
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id={`contact-${index}`}
                            value={user.contact}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "contact",
                                e.target.value
                              )
                            }
                            className="pl-8"
                            placeholder="Contact Number"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label htmlFor={`password-${index}`}>
                          New Password{" "}
                          <span className="text-xs text-muted-foreground">
                            (Optional)
                          </span>
                        </Label>
                        <div className="relative">
                          <KeyRound className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id={`password-${index}`}
                            type={showPasswords[index] ? "text" : "password"}
                            value={user.password || ""}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "password",
                                e.target.value
                              )
                            }
                            className="pl-8 pr-10"
                            placeholder="Leave blank to keep current password"
                            autoComplete="new-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                            onClick={() => togglePasswordVisibility(index)}
                          >
                            {showPasswords[index] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {showPasswords[index]
                                ? "Hide password"
                                : "Show password"}
                            </span>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter a new password only if you want to change it.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>

        {users.length > 0 && (
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Project Managers
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default function UpdateProjectManagers() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-10 px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <UpdateProjectManagersInner />
    </Suspense>
  );
}
