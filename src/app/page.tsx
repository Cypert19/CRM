import { redirect } from "next/navigation";

export default function Home() {
  // Middleware handles auth check and redirects:
  // - Authenticated users → /dashboard
  // - Unauthenticated users → /login
  // This is a fallback that should rarely be reached.
  redirect("/login");
}
