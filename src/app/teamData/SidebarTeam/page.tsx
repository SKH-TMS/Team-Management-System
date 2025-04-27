// src/app/teamData/SidebarTeam/page.tsx
"use client";

import React, { useContext } from "react"; // Removed useState
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthContext } from "@/context/AuthContext";
import {
  ListChecks,
  Users,
  ClipboardPlus,
  // Removed MenuIcon, CloseIcon
} from "lucide-react";

export default function SidebarTeam() {
  const { userStatus } = useContext(AuthContext);
  const pathname = usePathname();
  // Removed expanded state and toggle button logic

  if (!userStatus?.success) return null;

  const isMember =
    !!userStatus.TeamMember || !!userStatus.TeamMember_and_TeamLeader;
  const isLeader =
    !!userStatus.TeamLeader || !!userStatus.TeamMember_and_TeamLeader;

  const menuItems: {
    title: string;
    path: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [];
  if (isMember) {
    menuItems.push({
      title: "Perform Tasks",
      path: "/teamData/teamMemberData/ManageTasks",
      Icon: ListChecks,
    });
  }
  if (isLeader) {
    menuItems.push({
      title: "Manage Team",
      path: "/teamData/teamLeaderData/ShowTeams",
      Icon: Users,
    });
    menuItems.push({
      title: "Quick Subtask",
      path: "/teamData/teamLeaderData/QuickCreateSubtask",
      Icon: ClipboardPlus,
    });
  }

  // Return null if no items to show (optional, but good practice)
  if (menuItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Removed the mobile toggle button */}

      <aside
        className={cn(
          // --- Apply responsive visibility ---
          "hidden md:flex", // Hide by default, show as flex on md+ screens
          // --- Keep existing styles for desktop ---
          "fixed inset-y-0 left-0 z-40 flex-col border-r bg-background",
          "overflow-hidden pt-16 w-64" // Keep fixed width for desktop
          // Removed transition classes as they are not needed for simple hide/show
        )}
      >
        <nav className="flex-1 flex flex-col items-center space-y-1 pt-2">
          {menuItems.map(({ title, path, Icon }, idx) => {
            const isActive =
              pathname === path ||
              (pathname.startsWith(path + "/") && path !== "/");

            return (
              <Link
                key={idx}
                href={path}
                // Removed onClick for mobile state change
                className={cn(
                  "flex items-center h-12 w-full px-3 transition-colors justify-start",
                  isActive
                    ? "bg-muted text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="ml-3 whitespace-nowrap">{title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Removed the mobile overlay div */}
    </>
  );
}
