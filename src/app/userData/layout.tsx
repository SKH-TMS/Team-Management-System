"use client";

import NavbarUser from "./NavbarUser/page";
import React from "react";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarUser />
      {children}
    </>
  );
}
