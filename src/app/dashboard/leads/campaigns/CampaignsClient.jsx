"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function CampaignCard({ campaign, basePath }) {
  const pct = campaign.total > 0 ? Math.round((campaign.assigned / campaign.total) * 100) : 0;

  return (
    <Link
      href={`${basePath}/${encodeURIComponent(campaign.campaignId)}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{campaign.campaignName}</h3>
          <p className="mt-0.5 text-xs text-slate-400">Last lead {timeAgo(campaign.lastLeadAt)}</p>
        </div>
        {campaign.newCount > 0 && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {campaign.newCount} new
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-900">{campaign.total}</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-green-600">{campaign.assigned}</p>
          <p className="text-xs text-slate-400">Assigned</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-amber-600">{campaign.unassigned}</p>
          <p className="text-xs text-slate-400">Unassigned</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-400">{pct}% assigned</p>
      </div>
    </Link>
  );
}

export default function CampaignsClient() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const leadsHref = isAdmin ? "/admin/leads" : "/dashboard/leads";
  const campaignBasePath = isAdmin ? "/admin/leads/campaigns" : "/dashboard/leads/campaigns";

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/leads/campaigns");
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <Link href={leadsHref} className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← All leads
        </Link>

        <div className="mb-6 mt-4">
          <h1 className="text-xl font-semibold text-slate-900">Meta Campaigns</h1>
          <p className="mt-1 text-sm text-slate-500">Leads grouped by the campaign that generated them.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-sm font-medium text-slate-500">No Meta leads yet.</p>
            <p className="mt-1 text-xs text-slate-400">Campaigns will appear here as leads come in.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <CampaignCard key={c.campaignId} campaign={c} basePath={campaignBasePath} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}