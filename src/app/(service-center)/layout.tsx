"use client";
import { ReactNode } from "react";

interface ServiceCenterLayoutProps {
  children: ReactNode;
}

export default function ServiceCenterLayout({ children }: ServiceCenterLayoutProps) {
  return <>{children}</>;
}

