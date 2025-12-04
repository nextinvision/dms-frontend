"use client";
import { ReactNode } from "react";

interface InventoryManagerLayoutProps {
  children: ReactNode;
}

export default function InventoryManagerLayout({ children }: InventoryManagerLayoutProps) {
  return <>{children}</>;
}

