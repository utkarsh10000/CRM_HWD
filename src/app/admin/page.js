"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DateFilter from "./_components/DateFilter";

const NAV_OPTIONS = [
  {
    href: "/admin/manage-employees",
    title: "Manage Employees",
    description: "Add, edit, or remove employee accounts.",
  },
  {
    href: "/admin/manage-teams",
    title: "Manage Teams",
    description: "Create teams and assign members.",
  },
  {
    href: "/admin/manage-access",
    title: "Manage Access",
    description: "Grant seniors and managers visibility into a team's data.",
  },
  {
    href: "/admin/productivity-report",
    title: "Productivity Report",
    description: "View all daily reports submitted by employees.",
  },
  {
    href: "/admin/visit-report",
    title: "Visit Report",
    description: "See all completed visits across all employees.",
  },
  {
    href: "/admin/visit-planned",
    title: "Visit Planned",
    description: "See all visits currently planned or scheduled.",
  },
  {
    href: "/admin/pending-reports",
    title: "Pending Reports",
    description: "Find employees who haven't submitted their report.",
  },
  {
    href: "/dashboard/leads",
    title: "Leads",
    description: "View, distribute, and track all leads including Meta.",
  },
];

function StatCard({ label, value, loading }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-semibold text-slate-900">
        {loading ? "—" : value}
      </p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [filter, setFilter] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [stats, setStats] = useState({ planned: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [navLoadingHref, setNavLoadingHref] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const params = new URLSearchParams({ filter });
      if (filter === "custom") {
        if (customStart) params.set("start", customStart);
        if (customEnd) params.set("end", customEnd);
      }
      try {
        const res = await fetch(`/api/admin/stats?${params}`);
        const data = await res.json();
        setStats({ planned: data.planned ?? 0, done: data.done ?? 0 });
      } catch {
        // keep stale values
      } finally {
        setLoading(false);
      }
    }

    if (filter !== "custom" || (customStart && customEnd)) {
      fetchStats();
    }
  }, [filter, customStart, customEnd]);

  function handleFilterChange({ filter: f, start, end }) {
    setFilter(f);
    setCustomStart(start || "");
    setCustomEnd(end || "");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Overview and quick access.</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              disabled={loggingOut}
              onClick={async (e) => {
                e.preventDefault();
                if (loggingOut) return;
                setLoggingOut(true);
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/";
              }}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              )}
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </form>
        </div>

        {/* Stat cards */}
        <div className="mb-4">
          <DateFilter
            value={filter}
            customStart={customStart}
            customEnd={customEnd}
            onChange={handleFilterChange}
          />
        </div>
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Visit Planned" value={stats.planned} loading={loading} />
          <StatCard label="Visit Done" value={stats.done} loading={loading} />
        </div>

        {/* Nav options */}
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Reports & Data</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {NAV_OPTIONS.map((opt) => {
            const isLoadingThis = navLoadingHref === opt.href;
            return (
              <Link
                key={opt.href}
                href={opt.href}
                onClick={(e) => {
                  if (navLoadingHref !== null) {
                    e.preventDefault();
                    return;
                  }
                  setNavLoadingHref(opt.href);
                }}
                className={`relative rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/40 ${
                  navLoadingHref !== null && !isLoadingThis ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <h3 className="text-sm font-semibold text-slate-900">{opt.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{opt.description}</p>
                {isLoadingThis && (
                  <span className="absolute right-4 top-4 h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}