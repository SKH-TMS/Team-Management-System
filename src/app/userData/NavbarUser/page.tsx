// src/app/userData/NavbarUser/page.tsx
"use client";

import Link from "next/link";
import React, { useContext, useState } from "react";
import { useRouter, usePathname } from "next/navigation"; // Import usePathname
import toast from "react-hot-toast";
import { AuthContext } from "@/context/AuthContext";
import Image from "next/image";
import { cn } from "@/lib/utils"; // Import cn

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator"; // Import Separator

import {
  Menu,
  Home,
  UserPlus,
  LogIn,
  LogOut,
  UserCog,
  // --- Import Project Manager Sidebar Icons ---
  Layers,
  ListChecks,
  Users as UsersIcon, // Rename to avoid conflict with React.Users
} from "lucide-react";

// --- Define Project Manager Sidebar Item Type ---
interface PMSidebarMenuItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>; // Use lowercase 'icon' to match definition below
}

// --- Define Project Manager Sidebar Menu Items ---
const projectManagerMenuItems: PMSidebarMenuItem[] = [
  {
    title: "Manage Projects",
    path: "/projectManagerData/ProjectManagementData/ManageProject",
    icon: Layers,
  },
  {
    title: "Manage Tasks",
    path: "/projectManagerData/taskManagementData/ManageTasks",
    icon: ListChecks,
  },
  {
    title: "Manage Teams",
    path: "/projectManagerData/teamManagementData/ManageTeams",
    icon: UsersIcon,
  },
  {
    title: "Assign Projects",
    path: "/projectManagerData/ProjectManagementData/AssignProject",
    icon: UsersIcon, // Assuming same icon, adjust if needed
  },
];
// --- End Project Manager Sidebar Menu Items ---

export default function NavbarUser() {
  const { userStatus, refreshAuth } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname(); // Get current path
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const authLoading = userStatus === null;

  const isAuthenticated =
    !authLoading &&
    userStatus?.success &&
    (userStatus?.User || userStatus?.ProjectManager);
  const isPM = isAuthenticated && !!userStatus?.ProjectManager; // Check if Project Manager

  const handleLogout = async () => {
    // ... (keep existing handleLogout function)
    const logoutToastId = toast.loading("Logging out...");
    try {
      await fetch("/api/auth/logout", { method: "GET" });
      toast.dismiss(logoutToastId);
      toast.success("Logout Successful");
      await refreshAuth();
      // Redirect to login, or home page if preferred
      router.push("/userData/LoginUser");
    } catch (error) {
      toast.dismiss(logoutToastId);
      console.error("Error during logout:", error);
      toast.error("Logout failed. Please try again.");
    }
    setIsSheetOpen(false);
  };

  const profileLink = isPM
    ? "/projectManagerData/ProfileProjectManager"
    : "/userData/ProfileUser";

  // --- Renders standard links (Home, Register/Login or Profile/Logout) ---
  const renderStandardLinks = (isMobile = false) => (
    <>
      {/* Home Link - Always visible */}
      <Button
        variant={isMobile ? "ghost" : "link"}
        asChild
        className={`justify-start text-base ${isMobile ? "w-full" : ""}`}
      >
        <Link href="/">
          <Home className="w-4 h-4 mr-2" /> Home
        </Link>
      </Button>

      {/* Conditional Links */}
      {authLoading ? (
        // Loading Skeleton
        <div
          className={`flex ${
            isMobile ? "flex-col w-full" : "items-center"
          } gap-2`}
        >
          <div
            className={`h-8 w-24 bg-gray-200 rounded animate-pulse ${
              isMobile ? "mb-2" : ""
            }`}
          />
          {isMobile && (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          )}
        </div>
      ) : !isAuthenticated ? (
        // Not Authenticated: Register / Login
        <>
          <Button
            variant={isMobile ? "ghost" : "link"}
            asChild
            className={`justify-start text-base ${isMobile ? "w-full" : ""}`}
          >
            <Link href="/userData/RegisterUser">
              <UserPlus className="w-4 h-4 mr-2" /> Register
            </Link>
          </Button>
          <Button
            variant={isMobile ? "ghost" : "link"}
            asChild
            className={`justify-start text-base ${isMobile ? "w-full" : ""}`}
          >
            <Link href="/userData/LoginUser">
              <LogIn className="w-4 h-4 mr-2" /> Login
            </Link>
          </Button>
        </>
      ) : (
        // Authenticated: Profile / Logout
        <>
          <Button
            variant={isMobile ? "ghost" : "link"}
            asChild
            className={`justify-start text-base ${isMobile ? "w-full" : ""}`}
          >
            <Link href={profileLink}>
              <UserCog className="w-4 h-4 mr-2" /> My Profile
            </Link>
          </Button>
          <Button
            variant={isMobile ? "ghost" : "link"}
            onClick={handleLogout}
            className={`justify-start text-base ${
              isMobile
                ? "w-full text-red-600 hover:bg-red-50"
                : "text-red-600 hover:text-red-700"
            }`}
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </>
      )}
    </>
  );

  // --- Renders Project Manager specific links ONLY for the mobile sheet ---
  const renderPMSidebarLinksForMobile = () => {
    // Only render if authenticated as a Project Manager
    if (!isPM) {
      return null;
    }

    return projectManagerMenuItems.map((item, idx) => {
      const isActive =
        pathname === item.path ||
        (pathname.startsWith(item.path + "/") && item.path !== "/"); // Basic active check

      return (
        <Link
          key={`pm-link-${idx}`} // Use a unique key prefix
          href={item.path}
          onClick={() => setIsSheetOpen(false)} // Close sheet on click
          className={cn(
            "flex items-center h-10 w-full px-3 rounded-md text-base", // Mobile sheet styling
            "justify-start transition-colors",
            isActive
              ? "bg-muted text-primary font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-primary"
          )}
        >
          <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="whitespace-nowrap">{item.title}</span>
        </Link>
      );
    });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto h-16 flex items-center justify-between px-4 md:px-6">
        {/* Logo Section */}
        <div className="flex items-center gap-2 font-semibold text-lg cursor-pointer">
          <Image src="/logo.png" alt="TMS Logo" width={42} height={42} />
          <span className="hidden sm:inline-block text-foreground">
            {/* Display Role */}
            {userStatus?.User
              ? "User"
              : userStatus?.ProjectManager
                ? "Project Manager"
                : "Team Management"}
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {renderStandardLinks()}
        </div>

        {/* Mobile Menu Button & Sheet */}
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader className="mb-4 border-b pb-4">
                <SheetTitle className="text-left flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="TMS Logo"
                    width={28}
                    height={28}
                  />
                  Menu
                </SheetTitle>
              </SheetHeader>

              {/* --- Render Links within the Sheet --- */}
              <div className="flex flex-col gap-1">
                {/* Render PM Sidebar Links first if applicable */}
                {renderPMSidebarLinksForMobile()}

                {/* Add Separator if PM links were rendered and user is authenticated */}
                {isPM && isAuthenticated && <Separator className="my-2" />}

                {/* Render Standard Links (Home, Profile/Logout or Register/Login) */}
                {React.Children.map(renderStandardLinks(true), (child, idx) => {
                  // Wrap each link/button to ensure sheet closes on click
                  if (!React.isValidElement(child)) return child;
                  // Use a different key prefix for standard links
                  return (
                    <div
                      key={`std-link-${idx}`}
                      onClick={() => setIsSheetOpen(false)}
                    >
                      {child}
                    </div>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
