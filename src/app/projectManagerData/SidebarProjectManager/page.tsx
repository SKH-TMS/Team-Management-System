// src/app/projectManagerData/SidebarProjectManager/page.tsx
"use client";

import React from "react"; // Removed useState
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Layers, ListChecks, Users } from "lucide-react";
// Removed MenuIcon (List), CloseIcon (X)

// Define menu items directly here or import from a shared location if needed elsewhere
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
    icon: Users, // Assuming same icon
  },
];

export default function SidebarProjectManager() {
  const pathname = usePathname();
  // Removed expanded state and toggle logic

  return (
    <aside
      className={cn(
        // --- Apply responsive visibility ---
        "hidden md:flex", // Hide by default, show as flex column on md+
        // --- Keep existing styles for desktop ---
        "fixed inset-y-0 left-0 z-40 flex-col border-r bg-background",
        "overflow-hidden pt-16 w-64" // Fixed width for desktop
        // Removed transition classes
      )}
    >
      {/* Removed the mobile toggle button */}

      <nav className="flex-1 flex flex-col items-center space-y-1 pt-2">
        {menuItems.map((item, idx) => {
          const active =
            pathname === item.path ||
            (pathname.startsWith(item.path + "/") && item.path !== "/");

          return (
            <Link
              key={idx}
              href={item.path}
              // Removed onClick for mobile state change
              className={cn(
                "flex items-center h-12 w-full px-3 transition-colors", // Keep transition for hover effect
                "justify-start", // Align items to the start for desktop view
                active
                  ? "bg-muted text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-primary"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {/* Text is always visible on desktop now */}
              <span className="ml-3 whitespace-nowrap">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
