
import DashboardClient from "./DashboardClient";
import { cookies } from "next/headers";

// Force dynamic rendering to prevent caching of build artifacts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardPage() {
  // Reading cookies forces dynamic rendering in Next.js
  cookies();
  return <DashboardClient />;
}
