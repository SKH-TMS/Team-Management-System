"use client";

import NavbarAdmin from "./NavbarAdmin/page";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarAdmin />
      {children}
    </>
  );
}
