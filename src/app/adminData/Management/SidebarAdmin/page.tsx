// src/app/adminData/Management/SidebarAdmin/page.tsx
"use client";

import React from "react"; // Removed useState
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Users, Briefcase } from "lucide-react"; // Removed ListIcon, XIcon

// Define menu items directly here or import if needed elsewhere
const menuItems = [
  {
    title: "Manage Users",
    path: "/adminData/Management/AllUsers",
    icon: Users,
  },
  {
    title: "Manage PMs",
    path: "/adminData/Management/AllProjectManagers",
    icon: Briefcase,
  },
  {
    title: "Team Members",
    path: "/adminData/Management/AllTeamParticipants",
    icon: Users, // Assuming same icon
  },
];

export default function SidebarAdmin() {
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
        // Removed transition classes and mobile width logic
      )}
    >
      {/* Removed the mobile toggle button */}

      <nav className="flex-1 flex flex-col items-center space-y-1 pt-2">
        {menuItems.map((item, idx) => {
          const isActive =
            pathname === item.path ||
            (pathname.startsWith(item.path + "/") && item.path !== "/");

          return (
            <Link
              key={idx}
              href={item.path}
              // Removed onClick for mobile state change
              className={cn(
                "flex items-center h-12 w-full px-3 transition-colors",
                "justify-start", // Align items to the start for desktop
                isActive
                  ? "bg-muted text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-primary"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {/* Text is always visible on desktop */}
              <span className="ml-3 whitespace-nowrap">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
