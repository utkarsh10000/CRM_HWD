import LeadsClient from "@/app/dashboard/leads/LeadsClient";

export default async function AdminCampaignLeadsPage({ params }) {
  const { campaignId } = await params;
  return <LeadsClient campaignId={decodeURIComponent(campaignId)} />;
}