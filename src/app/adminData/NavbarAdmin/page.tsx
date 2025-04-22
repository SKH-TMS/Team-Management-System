"use client";

import Link from "next/link";
import React, { useContext, useState } from "react";
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

export default function NavbarAdmin() {
  const { userStatus, refreshAuth } = useContext(AuthContext);
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isAuthenticated = userStatus?.success && userStatus?.Admin;

  const handleLogout = async () => {
    const logoutToastId = toast.loading("Logging out...");
    try {
      await fetch("/api/auth/logout", { method: "GET" });
      toast.dismiss(logoutToastId);
      toast.success("Logout Successful");
      await refreshAuth();
      router.push("/adminData/LoginAdmin");
    } catch (error) {
      toast.dismiss(logoutToastId);
      console.error("Error during logout:", error);
      toast.error("Logout failed. Please try again.");
    }
    setIsSheetOpen(false);
  };

  const renderLinks = (isMobile = false) => (
    <>
      <Button
        variant={isMobile ? "ghost" : "link"}
        asChild
        className={`justify-start text-base ${isMobile ? "w-full" : ""}`}
      >
        <Link href="/">
          {" "}
          <Home className="w-4 h-4 mr-2" /> Home{" "}
        </Link>
      </Button>

      {!isAuthenticated ? (
        <>
          <Button
            variant={isMobile ? "ghost" : "link"}
            asChild
            className={`justify-start text-base ${isMobile ? "w-full" : ""}`}
          >
            <Link href="/adminData/RegisterAdmin">
              {" "}
              <UserPlus className="w-4 h-4 mr-2" /> Admin Register{" "}
            </Link>
          </Button>
          <Button
            variant={isMobile ? "ghost" : "link"}
            asChild
            className={`justify-start text-base ${isMobile ? "w-full" : ""}`}
          >
            <Link href="/adminData/LoginAdmin">
              {" "}
              <LogIn className="w-4 h-4 mr-2" /> Admin Login{" "}
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
            <Link href="/adminData/Management/ProfileAdmin">
              {" "}
              <UserCog className="w-4 h-4 mr-2" /> Admin Profile{" "}
            </Link>
          </Button>
          <Button
            variant={isMobile ? "ghost" : "link"}
            onClick={handleLogout}
            className={`justify-start text-base ${isMobile ? "w-full text-red-600 hover:bg-red-50" : "text-red-600 hover:text-red-700"}`}
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
        <Link
          href={isAuthenticated ? "/adminData/Management/ProfileAdmin" : "/"}
          className="flex items-center gap-2 font-semibold text-lg"
        >
          <Image src="/logo.png" alt="TMS Logo" width={36} height={36} />
          <span className="hidden sm:inline-block text-foreground">
            Admin Portal
          </span>
        </Link>

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
                  Admin Menu
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2">
                {/* --- FIXED MAPPING LOGIC --- */}
                {React.Children.map(renderLinks(true), (child, index) => {
                  // Check if it's a valid React element
                  if (!React.isValidElement(child)) {
                    return child;
                  }
                  return (
                    <div key={index} onClick={() => setIsSheetOpen(false)}>
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
