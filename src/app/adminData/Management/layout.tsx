import SidebarAdmin from "./SidebarAdmin/page";
import React from "react";

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <SidebarAdmin />
      <main className="flex-1 md:pl-64 p-4 sm:p-6 md:p-8 flex flex-col">
        {children}
      </main>
    </div>
  );
}
