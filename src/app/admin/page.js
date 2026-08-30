"use client";

import { useEffect, useState } from "react";
import DateFilter from "./_components/DateFilter";

function StatCard({ label, value, loading }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "—" : value}</p>
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
    if (filter !== "custom" || (customStart && customEnd)) fetchStats();
  }, [filter, customStart, customEnd]);

  function handleFilterChange({ filter: f, start, end }) {
    setFilter(f);
    setCustomStart(start || "");
    setCustomEnd(end || "");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview across your team.</p>

        <div className="mt-6">
          <DateFilter value={filter} customStart={customStart} customEnd={customEnd} onChange={handleFilterChange} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Visit Planned" value={stats.planned} loading={loading} />
          <StatCard label="Visit Done" value={stats.done} loading={loading} />
        </div>
      </div>
    </main>
  );
}