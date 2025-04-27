// src/app/adminData/NavbarAdmin/page.tsx
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
  // --- Import Admin Sidebar Icons ---
  Users as UsersIcon, // Rename to avoid potential conflicts
  Briefcase,
} from "lucide-react";

// --- Define Admin Sidebar Item Type ---
interface AdminSidebarMenuItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

// --- Define Admin Sidebar Menu Items ---
const adminMenuItems: AdminSidebarMenuItem[] = [
  {
    title: "Manage Users",
    path: "/adminData/Management/AllUsers",
    icon: UsersIcon,
  },
  {
    title: "Manage PMs",
    path: "/adminData/Management/AllProjectManagers",
    icon: Briefcase,
  },
  {
    title: "Team Members",
    path: "/adminData/Management/AllTeamParticipants",
    icon: UsersIcon, // Assuming same icon
  },
];
// --- End Admin Sidebar Menu Items ---

export default function NavbarAdmin() {
  const { userStatus, refreshAuth } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname(); // Get current path
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Check specifically for Admin role
  const isAuthenticated = !!userStatus?.success && !!userStatus?.Admin;

  const handleLogout = async () => {
    // ... (keep existing handleLogout function)
    const logoutToastId = toast.loading("Logging out...");
    try {
      await fetch("/api/auth/logout", { method: "GET" });
      toast.dismiss(logoutToastId);
      toast.success("Logout Successful");
      await refreshAuth();
      router.push("/adminData/LoginAdmin"); // Redirect to Admin login
    } catch (error) {
      toast.dismiss(logoutToastId);
      console.error("Error during logout:", error);
      toast.error("Logout failed. Please try again.");
    }
    setIsSheetOpen(false);
  };

  // --- Renders standard links (Home, Register/Login or Profile/Logout) ---
  const renderStandardLinks = (isMobile = false) => (
    <>
      {/* Home Link */}
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
      {!isAuthenticated ? (
        // Not Authenticated: Register / Login
        <>
          <Button
            variant={isMobile ? "ghost" : "link"}
            asChild
            className={`justify-start text-base ${isMobile ? "w-full" : ""}`}
          >
            <Link href="/adminData/RegisterAdmin">
              <UserPlus className="w-4 h-4 mr-2" /> Admin Register
            </Link>
          </Button>
          <Button
            variant={isMobile ? "ghost" : "link"}
            asChild
            className={`justify-start text-base ${isMobile ? "w-full" : ""}`}
          >
            <Link href="/adminData/LoginAdmin">
              <LogIn className="w-4 h-4 mr-2" /> Admin Login
            </Link>
          </Button>
        </>
      ) : (
        // Authenticated Admin: Profile / Logout
        <>
          <Button
            variant={isMobile ? "ghost" : "link"}
            asChild
            className={`justify-start text-base ${isMobile ? "w-full" : ""}`}
          >
            {/* Ensure this profile link is correct */}
            <Link href="/adminData/Management/ProfileAdmin">
              <UserCog className="w-4 h-4 mr-2" /> Admin Profile
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

  // --- Renders Admin specific sidebar links ONLY for the mobile sheet ---
  const renderAdminSidebarLinksForMobile = () => {
    // Only render if authenticated as Admin
    if (!isAuthenticated) {
      return null;
    }

    // Check if the current path is within the Management section
    // to decide whether to show these links. Adjust this logic if needed.
    const showManagementLinks = pathname.startsWith("/adminData/Management");
    if (!showManagementLinks) {
      return null; // Don't show management links outside the management section
    }

    return adminMenuItems.map((item, idx) => {
      const isActive =
        pathname === item.path ||
        (pathname.startsWith(item.path + "/") && item.path !== "/");

      return (
        <Link
          key={`admin-link-${idx}`} // Unique key prefix
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
        <Link
          // Link logo to admin profile if authenticated, otherwise home
          href={isAuthenticated ? "/adminData/Management/ProfileAdmin" : "/"}
          className="flex items-center gap-2 font-semibold text-lg"
        >
          <Image src="/logo.png" alt="TMS Logo" width={36} height={36} />
          <span className="hidden sm:inline-block text-foreground">
            Admin Portal
          </span>
        </Link>

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
                  Admin Menu
                </SheetTitle>
              </SheetHeader>

              {/* --- Render Links within the Sheet --- */}
              <div className="flex flex-col gap-1">
                {/* Render Admin Sidebar Links first if applicable */}
                {renderAdminSidebarLinksForMobile()}

                {/* Add Separator if Admin links were rendered */}
                {isAuthenticated &&
                  pathname.startsWith("/adminData/Management") && (
                    <Separator className="my-2" />
                  )}

                {/* Render Standard Links (Home, Profile/Logout or Register/Login) */}
                {React.Children.map(renderStandardLinks(true), (child, idx) => {
                  if (!React.isValidElement(child)) return child;
                  return (
                    <div
                      key={`std-link-${idx}`} // Unique key prefix
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
