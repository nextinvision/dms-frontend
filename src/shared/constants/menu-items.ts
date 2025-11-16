/**
 * Menu items configuration
 */
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Building,
  Users,
  Package,
  CheckCircle,
  DollarSign,
  FileText,
  AlertCircle,
  ClipboardList,
} from "lucide-react";

export interface MenuItem {
  name: string;
  icon: LucideIcon;
  href: string;
  children?: MenuItem[];
}

export const ADMIN_MENU_ITEMS: MenuItem[] = [
  { name: "Dashboard", icon: Home, href: "/dashboarda" },
  { name: "Service Centers", icon: Building, href: "/servicecenters" },
  { name: "Users & Roles", icon: Users, href: "/user&roles" },
  { name: "Inventory", icon: Package, href: "/inventory" },
  { name: "Approvals", icon: CheckCircle, href: "/approvals" },
  { name: "Finance", icon: DollarSign, href: "/finance" },
  { name: "Reports", icon: FileText, href: "/reports" },
  { name: "Complaints", icon: AlertCircle, href: "/complaints" },
  { name: "Audit Logs", icon: ClipboardList, href: "/audit-logs" },
];

