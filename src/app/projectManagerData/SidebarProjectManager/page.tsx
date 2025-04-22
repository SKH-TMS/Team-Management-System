"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Layers, ListChecks, Users } from "lucide-react";
import { List as MenuIcon, X as CloseIcon } from "lucide-react";

export default function SidebarProjectManager() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  const menuItems = [
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
      icon: Users,
    },
    {
      title: "Assign Projects",
      path: "/projectManagerData/ProjectManagementData/AssignProject",
      icon: Users,
    },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background " +
          "overflow-hidden transition-all duration-200 ease-in-out pt-16",
        expanded ? "w-64" : "w-16",

        "md:w-64 md:flex"
      )}
    >
      <button
        className="absolute top-4 right-[-1rem] p-1 rounded-full bg-background shadow-md md:hidden"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {expanded ? (
          <CloseIcon className="h-6 w-6" />
        ) : (
          <MenuIcon className="h-6 w-6" />
        )}
      </button>

      <nav className="flex-1 flex flex-col items-center space-y-1 pt-2">
        {menuItems.map((item, idx) => {
          const active =
            pathname === item.path || pathname.startsWith(item.path + "/");

          return (
            <Link
              key={idx}
              href={item.path}
              onClick={() => expanded && setExpanded(false)}
              className={cn(
                "flex items-center h-12 w-full px-3 transition-colors " +
                  "justify-center text-muted-foreground hover:bg-muted hover:text-primary",
                active && "bg-muted text-primary font-semibold"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span
                className={cn(
                  "ml-3 whitespace-nowrap",
                  expanded ? "inline-block" : "hidden",
                  "md:inline-block"
                )}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
