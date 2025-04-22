"use client";

import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AuthContext } from "@/context/AuthContext";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Menu, Home, UserPlus, LogIn, LogOut, UserCog } from "lucide-react";

export default function NavbarUser() {
  const { userStatus, refreshAuth } = useContext(AuthContext);

  const authLoading = userStatus === null;

  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isAuthenticated =
    !authLoading &&
    userStatus?.success &&
    (userStatus?.User || userStatus?.ProjectManager);
  const isPM = isAuthenticated && !!userStatus?.ProjectManager;

  const handleLogout = async () => {
    const logoutToastId = toast.loading("Logging out...");
    try {
      await fetch("/api/auth/logout", { method: "GET" });
      toast.dismiss(logoutToastId);
      toast.success("Logout Successful");
      await refreshAuth();
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

  const renderLinks = (isMobile = false) => (
    <>
      <Button
        variant={isMobile ? "ghost" : "link"}
        asChild
        className={`justify-start text-base ${isMobile ? "w-full" : ""}`}
      >
        <Link href="/">
          <Home className="w-4 h-4 mr-2" /> Home
        </Link>
      </Button>

      {authLoading ? (
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

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto h-16 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold text-lg cursor-pointer">
          <Image src="/logo.png" alt="TMS Logo" width={42} height={42} />
          <span className="hidden sm:inline-block text-foreground">
            {userStatus?.User
              ? "User"
              : userStatus?.ProjectManager
                ? "Project Manager"
                : "Team Management"}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1">{renderLinks()}</div>

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
              <div className="flex flex-col gap-2">
                {React.Children.map(renderLinks(true), (child, idx) => {
                  if (!React.isValidElement(child)) return child;
                  return (
                    <div key={idx} onClick={() => setIsSheetOpen(false)}>
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
