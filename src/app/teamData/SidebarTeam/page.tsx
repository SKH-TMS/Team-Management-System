"use client";

import React, { useState, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthContext } from "@/context/AuthContext";
import {
  ListChecks,
  Users,
  ClipboardPlus,
  Menu as MenuIcon,
  X as CloseIcon,
} from "lucide-react";

export default function SidebarTeam() {
  const { userStatus } = useContext(AuthContext);
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

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

  return (
    <>
      <button
        onClick={() => setExpanded(!expanded)}
        className="fixed top-[200px] left-0 z-50 p-1.5 bg-background shadow-md rounded-r-md md:hidden"
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {expanded ? (
          <CloseIcon className="h-5 w-5" />
        ) : (
          <MenuIcon className="h-5 w-5" />
        )}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background " +
            "overflow-hidden transition-all duration-200 ease-in-out pt-16",

          expanded ? "translate-x-0 w-64" : "-translate-x-full",

          "md:translate-x-0 md:w-64"
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
                onClick={() => expanded && setExpanded(false)}
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

      {expanded && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setExpanded(false)}
        />
      )}
    </>
  );
}
