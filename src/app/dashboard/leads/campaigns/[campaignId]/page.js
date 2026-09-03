import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LeadsClient from "@/app/dashboard/leads/LeadsClient";

export default async function CampaignLeadsPage({ params }) {
  const session = await getSession();
  if (!session) redirect("/");
  const { campaignId } = await params;
  return <LeadsClient campaignId={decodeURIComponent(campaignId)} />;
}