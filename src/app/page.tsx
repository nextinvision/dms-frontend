
import LoginClient from "./LoginClient";
import { cookies } from "next/headers";

// Force dynamic rendering to prevent caching of build artifacts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LoginPage() {
    // Reading cookies forces dynamic rendering in Next.js
    cookies();
    return <LoginClient />;
}
