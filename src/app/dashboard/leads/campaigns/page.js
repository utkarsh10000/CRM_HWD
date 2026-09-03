import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import CampaignsClient from "./CampaignsClient";

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session) redirect("/");
  return <CampaignsClient />;
}