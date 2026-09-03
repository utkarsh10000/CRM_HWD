import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Lead from "@/models/Lead";
import { getSession } from "@/lib/session";
import { buildLeadVisibilityQuery } from "@/lib/leadAccess";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  await dbConnect();
  const visibilityQuery = await buildLeadVisibilityQuery(session);

  const leads = await Lead.find({ ...visibilityQuery, source: "meta" })
    .select("meta.campaignId meta.campaignName meta.submittedAt status assignedTo")
    .lean();

  const byCampaign = new Map();
  for (const lead of leads) {
    const id = lead.meta?.campaignId || "unattributed";
    const name = lead.meta?.campaignName || (id === "unattributed" ? "Unattributed / Unknown Campaign" : id);

    if (!byCampaign.has(id)) {
      byCampaign.set(id, {
        campaignId: id,
        campaignName: name,
        total: 0,
        newCount: 0,
        assigned: 0,
        unassigned: 0,
        statusBreakdown: {},
        lastLeadAt: null,
      });
    }
    const c = byCampaign.get(id);
    c.total += 1;
    if (lead.status === "new") c.newCount += 1;
    if (lead.assignedTo) c.assigned += 1;
    else c.unassigned += 1;
    c.statusBreakdown[lead.status] = (c.statusBreakdown[lead.status] || 0) + 1;
    const submitted = lead.meta?.submittedAt;
    if (submitted && (!c.lastLeadAt || new Date(submitted) > new Date(c.lastLeadAt))) {
      c.lastLeadAt = submitted;
    }
  }

  const campaigns = [...byCampaign.values()].sort(
    (a, b) => new Date(b.lastLeadAt || 0) - new Date(a.lastLeadAt || 0)
  );

  return NextResponse.json({ campaigns });
}