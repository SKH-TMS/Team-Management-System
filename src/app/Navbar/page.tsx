"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Menu, Home, User, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const [isAuthenticatedPM, setIsAuthenticatedPM] = useState(false);
  const [isAuthenticatedTML, setIsAuthenticatedTML] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const response = await fetch("/api/auth/UserStatus", {
          method: "POST",
          cache: "no-store",
        });
        const data = await response.json();
        if (data.success) {
          setIsAuthenticatedPM(!!data.ProjectManager);
          setIsAuthenticatedTML(!!data.TML);
          setIsAuthenticatedUser(!!data.User);
          setIsAuthenticatedAdmin(!!data.Admin);
        } else {
          setIsAuthenticatedPM(false);
          setIsAuthenticatedTML(false);
          setIsAuthenticatedUser(false);
          setIsAuthenticatedAdmin(false);
          console.error("Navbar: Error fetching user status.");
        }
      } catch (error) {
        setIsAuthenticatedPM(false);
        setIsAuthenticatedTML(false);
        setIsAuthenticatedUser(false);
        setIsAuthenticatedAdmin(false);
        console.error("Navbar: Exception fetching user status:", error);
      }
    };

    fetchUserStatus();
  }, []);

  const profileHref = isAuthenticatedPM
    ? "/projectManagerData/ProfileProjectManager"
    : isAuthenticatedTML
      ? "/teamData/ProfileTeam"
      : isAuthenticatedUser
        ? "/userData/ProfileUser"
        : "/userData/LoginUser";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto h-14 flex items-center justify-between px-4 md:px-6 cursor-pointer">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Image src="/logo.png" alt="TMS Logo" width={42} height={42} />
          <span className="hidden sm:inline-block">Team Management</span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          <Button variant="link" asChild className="text-base">
            <Link href="/">
              <Home className="w-4 h-4 mr-1" /> Home
            </Link>
          </Button>

          <Button variant="link" asChild className="text-base">
            <Link href={profileHref}>
              <User className="w-4 h-4 mr-1" /> User
            </Link>
          </Button>
          {isAuthenticatedAdmin ? (
            <Button variant="link" asChild className="text-base">
              <Link href="/adminData/Management/ProfileAdmin">
                <ShieldCheck className="w-4 h-4 mr-1" /> Admin
              </Link>
            </Button>
          ) : (
            <Button variant="link" asChild className="text-base">
              <Link href="/adminData/LoginAdmin">
                <ShieldCheck className="w-4 h-4 mr-1" /> Admin
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile Sheet Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="mb-4 border-b pb-4">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2">
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start text-base"
                  >
                    <Link href="/">
                      <Home className="w-4 h-4 mr-2" /> Home
                    </Link>
                  </Button>
                </SheetClose>

                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start text-base"
                  >
                    <Link href={profileHref}>
                      <User className="w-4 h-4 mr-2" /> User
                    </Link>
                  </Button>
                </SheetClose>

                {isAuthenticatedAdmin ? (
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-start text-base"
                    >
                      <Link href="/adminData/Management/ProfileAdmin">
                        <ShieldCheck className="w-4 h-4 mr-2" /> Admin
                      </Link>
                    </Button>
                  </SheetClose>
                ) : (
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-start text-base"
                    >
                      <Link href="/adminData/LoginAdmin">
                        <ShieldCheck className="w-4 h-4 mr-2" /> Admin
                      </Link>
                    </Button>
                  </SheetClose>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
