import NavbarTeam from "../teamData/NavbarTeam/page";
import React from "react";
import SidebarTeam from "./SidebarTeam/page";
export default function TeamParticipentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarTeam />

      <div className="flex min-h-[calc(100vh-4rem)] w-full bg-muted/40">
        <SidebarTeam />

        <main className="flex-1 md:pl-64 p-4 sm:p-6 md:p-8 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
