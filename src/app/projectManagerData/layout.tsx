import NavbarUser from "../userData/NavbarUser/page";
import SidebarProjectManager from "./SidebarProjectManager/page";
import React from "react";

export default function ProjectManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarUser />

      <div className="flex min-h-[calc(100vh-4rem)] w-full bg-muted/40">
        <SidebarProjectManager />

        <main className="flex-1 md:pl-64 p-4 sm:p-6 md:p-8 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
