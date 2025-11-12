"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SCSidebar from "@/components/SCSidebar";
import Navbar from "@/components/Navbar";
import "./globals.css";

export default function RootLayout({ children }) {
  const [open, setOpen] = useState(false);
  const [userRole, setUserRole] = useState("admin");
  const pathname = usePathname();

  useEffect(() => {
    // Get role from localStorage
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole") || "admin";
      setUserRole(role);
    }
  }, [pathname]);

  // ✅ Hide navbar and sidebar on login page
  const isLoggedIn = pathname !== "/";
  
  // Determine if user is on service center pages
  const isServiceCenterPage = pathname?.startsWith("/sc");
  // Use SC sidebar for service center roles or SC pages
  const useSCSidebar = isServiceCenterPage || (userRole !== "admin" && userRole !== "super_admin");

  return (
    <html lang="en">
      <body className="antialiased bg-[#f9f9fb] flex" suppressHydrationWarning>
        {/* ✅ Sidebar only shown if logged in - Role-based sidebar */}
        {isLoggedIn && (
          useSCSidebar ? (
            <SCSidebar open={open} setOpen={setOpen} role={userRole} />
          ) : (
            <Sidebar open={open} setOpen={setOpen} />
          )
        )}

        {/* ✅ Main Area */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            isLoggedIn 
              ? (open ? "ml-64 md:ml-64" : "ml-0 md:ml-20") 
              : "ml-0"
          }`}
        >
          {/* ✅ Navbar only shown if logged in */}
          {isLoggedIn && <Navbar setOpen={setOpen} isLoggedIn={isLoggedIn} />}

          <main className={isLoggedIn ? "pt-16 px-6 md:px-8" : "px-0"}>{children}</main>
        </div>
      </body>
    </html>
  );
}
