"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DateFilter from "./_components/DateFilter";

const NAV_OPTIONS = [
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
              onClick={async (e) => {
                e.preventDefault();
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/";
              }}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Sign out
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
          {NAV_OPTIONS.map((opt) => (
            <Link
              key={opt.href}
              href={opt.href}
              className="rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
            >
              <h3 className="text-sm font-semibold text-slate-900">{opt.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{opt.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}