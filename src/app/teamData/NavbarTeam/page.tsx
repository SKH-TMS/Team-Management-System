// src/app/teamData/NavbarTeam/page.tsx
"use client";

import Link from "next/link";
import React, { useContext, useState } from "react";
import { useRouter, usePathname } from "next/navigation"; // Import usePathname
import toast from "react-hot-toast";
import Image from "next/image";

import { AuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator"; // Import Separator
import { cn } from "@/lib/utils"; // Import cn

import {
  Menu,
  UserCog,
  LogOut,
  // --- Import Sidebar Icons ---
  ListChecks,
  Users,
  ClipboardPlus,
} from "lucide-react";

// --- Define Sidebar Item Type (optional but good practice) ---
interface SidebarMenuItem {
  title: string;
  path: string;
  Icon: React.ComponentType<{ className?: string }>;
}

export default function NavbarTeam() {
  const { userStatus, refreshAuth } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname(); // Get current path
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const authLoading = userStatus === null;

  const isAuthenticated =
    !authLoading &&
    userStatus?.success &&
    (userStatus?.TeamMember ||
      userStatus?.TeamLeader ||
      userStatus?.TeamMember_and_TeamLeader);

  // --- Logic to generate Sidebar Menu Items (copied from SidebarTeam) ---
  const sidebarMenuItems: SidebarMenuItem[] = [];
  if (userStatus?.success) {
    const isMember =
      !!userStatus.TeamMember || !!userStatus.TeamMember_and_TeamLeader;
    const isLeader =
      !!userStatus.TeamLeader || !!userStatus.TeamMember_and_TeamLeader;

    if (isMember) {
      sidebarMenuItems.push({
        title: "Perform Tasks",
        path: "/teamData/teamMemberData/ManageTasks",
        Icon: ListChecks,
      });
    }
    if (isLeader) {
      sidebarMenuItems.push({
        title: "Manage Team",
        path: "/teamData/teamLeaderData/ShowTeams",
        Icon: Users,
      });
      sidebarMenuItems.push({
        title: "Quick Subtask",
        path: "/teamData/teamLeaderData/QuickCreateSubtask",
        Icon: ClipboardPlus,
      });
    }
  }
  // --- End Sidebar Menu Item Logic ---

  const handleLogout = async () => {
    // ... (keep existing handleLogout function)
    const toastId = toast.loading("Logging out...");
    try {
      await fetch("/api/auth/logout", { method: "GET" });
      toast.dismiss(toastId);
      toast.success("Logout Successful");
      await refreshAuth();
      router.push("/userData/LoginUser");
    } catch (err) {
      toast.dismiss(toastId);
      console.error(err);
      toast.error("Logout failed");
    }
    setIsSheetOpen(false);
  };

  // --- Renamed original renderLinks to renderNavbarLinks ---
  const renderNavbarLinks = (isMobile = false) => {
    if (authLoading) {
      // ... (keep existing loading state)
      return (
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
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return (
      <>
        <Button
          variant={isMobile ? "ghost" : "link"}
          asChild
          className={`justify-start text-base ${isMobile ? "w-full" : ""}`}
        >
          <Link href="/teamData/ProfileTeam">
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
    );
  };

  // --- Function to render Sidebar Links specifically for the mobile sheet ---
  const renderSidebarLinksForMobile = () => {
    if (authLoading || !isAuthenticated || sidebarMenuItems.length === 0) {
      return null; // Don't render if loading, not authenticated, or no items
    }

    return sidebarMenuItems.map(({ title, path, Icon }, idx) => {
      const isActive =
        pathname === path || (pathname.startsWith(path + "/") && path !== "/");

      return (
        <Link
          key={idx}
          href={path}
          onClick={() => setIsSheetOpen(false)} // Close sheet on click
          className={cn(
            "flex items-center h-10 w-full px-3 rounded-md text-base", // Adjusted height/padding
            "justify-start transition-colors",
            isActive
              ? "bg-muted text-primary font-medium" // Use font-medium for active
              : "text-muted-foreground hover:bg-muted hover:text-primary"
          )}
        >
          <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="whitespace-nowrap">{title}</span>
        </Link>
      );
    });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto h-16 flex items-center justify-between px-4 md:px-6">
        {/* ... (keep existing logo section) ... */}
        <div className="flex items-center gap-2 font-semibold text-lg cursor-pointer">
          <Image src="/logo.png" alt="TMS Logo" width={42} height={42} />
          <span className="hidden sm:inline-block text-foreground">
            {userStatus?.TeamMember
              ? "TeamMember"
              : userStatus?.TeamLeader
                ? "TeamLeader"
                : "Legend"}
          </span>
        </div>

        {/* --- Desktop Navbar Links --- */}
        <div className="hidden md:flex items-center gap-1">
          {renderNavbarLinks()}
        </div>

        {/* --- Mobile Menu Button --- */}
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
                <SheetTitle className="flex items-center gap-2 text-left">
                  <Image
                    src="/logo.png"
                    alt="TMS Logo"
                    width={28}
                    height={28}
                  />
                  Menu
                </SheetTitle>
              </SheetHeader>
              {/* --- Render Sidebar Links First --- */}
              <div className="flex flex-col gap-1 mb-4">
                {renderSidebarLinksForMobile()}
              </div>

              {/* --- Separator --- */}
              {isAuthenticated && sidebarMenuItems.length > 0 && (
                <Separator className="my-4" />
              )}

              {/* --- Render Original Navbar Links (Profile/Logout) --- */}
              <div className="flex flex-col gap-1">
                {/* Use React.Children.map ONLY if renderNavbarLinks returns multiple elements directly */}
                {/* If it returns fragments or single elements, a direct call is fine */}
                {React.Children.map(renderNavbarLinks(true), (child, idx) =>
                  React.isValidElement(child) ? (
                    <div key={idx} onClick={() => setIsSheetOpen(false)}>
                      {child}
                    </div>
                  ) : (
                    child
                  )
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
