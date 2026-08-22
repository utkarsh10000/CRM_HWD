import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import TeamViewClient from "./TeamViewClient";

export default async function TeamViewPage() {
  const session = await getSession();
  if (!session || session.role === "admin") {
    redirect(session?.role === "admin" ? "/admin" : "/");
  }

  return <TeamViewClient />;
}