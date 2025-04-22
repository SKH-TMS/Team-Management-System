"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Users, Briefcase, List as ListIcon, X as XIcon } from "lucide-react";

export default function SidebarAdmin() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

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
      icon: Users,
    },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background pt-16 " +
          "overflow-hidden transition-all duration-200 ease-in-out",
        expanded ? "w-64" : "w-16",

        "md:w-64"
      )}
    >
      <button
        className="absolute top-4 right-[-1rem] hidden p-1 rounded-full 
                   bg-background shadow-md md:hidden"
        onClick={() => setExpanded((x) => !x)}
      >
        {expanded ? (
          <XIcon className="h-6 w-6" />
        ) : (
          <ListIcon className="h-6 w-6" />
        )}
      </button>

      <nav className="flex-1 flex flex-col items-center space-y-1 pt-2">
        {menuItems.map((item, idx) => {
          const isActive =
            pathname === item.path ||
            (pathname.startsWith(item.path + "/") && item.path !== "/");

          return (
            <Link
              key={idx}
              href={item.path}
              className={cn(
                "flex items-center h-12 w-full px-3 transition-colors",
                "justify-center text-muted-foreground hover:bg-muted hover:text-primary",
                isActive && "bg-muted text-primary font-semibold"
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
