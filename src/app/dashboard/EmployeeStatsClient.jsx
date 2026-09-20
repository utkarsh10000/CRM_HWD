"use client";

import { useEffect, useMemo, useState } from "react";
import DateFilter from "@/app/admin/_components/DateFilter";

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function StatCard({ label, value, loading }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-slate-900 sm:mt-2 sm:text-3xl">
        {loading ? "—" : value}
      </p>
    </div>
  );
}

// businessClocked is ranked on internally but its actual count is never
// shown — treated as private, only the resulting position/name is surfaced.
const CATEGORIES = [
  { key: "visitsDone", label: "Visit Done", unit: "visit", private: false },
  { key: "businessClocked", label: "Business Clocked", unit: "business", private: true },
  { key: "bookings", label: "Total Booking", unit: "booking", private: false },
  { key: "meetings", label: "Meetings", unit: "meeting", private: false },
];

// Ranks every employee by a single metric. Ties fall back to name so the
// order is stable and deterministic rather than depending on array order.
function rankByMetric(stats, metricKey) {
  return [...stats]
    .sort((a, b) => b[metricKey] - a[metricKey] || a.name.localeCompare(b.name))
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

export default function EmployeeStatsClient() {
  const [filter, setFilter] = useState("thismonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [stats, setStats] = useState({ visitPlanned: 0, visitDone: 0, leadsAssigned: 0, totalBooking: 0 });
  const [leaderStats, setLeaderStats] = useState([]);
  const [yourEmployeeId, setYourEmployeeId] = useState("");
  const [category, setCategory] = useState("bookings");
  const [loading, setLoading] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const params = new URLSearchParams({ filter });
      if (filter === "custom") {
        if (customStart) params.set("start", customStart);
        if (customEnd) params.set("end", customEnd);
      }

      setLoading(true);
      setLoadingBoard(true);
      try {
        const [statsRes, boardRes] = await Promise.all([
          fetch(`/api/dashboard/stats?${params}`),
          fetch(`/api/dashboard/leaderboard?${params}`),
        ]);
        const statsData = await statsRes.json();
        const boardData = await boardRes.json();
        setStats({
          visitPlanned: statsData.visitPlanned ?? 0,
          visitDone: statsData.visitDone ?? 0,
          leadsAssigned: statsData.leadsAssigned ?? 0,
          totalBooking: statsData.totalBooking ?? 0,
        });
        setLeaderStats(boardData.stats ?? []);
        setYourEmployeeId(boardData.yourEmployeeId ?? "");
      } catch {
        // keep stale values
      } finally {
        setLoading(false);
        setLoadingBoard(false);
      }
    }

    if (filter !== "custom" || (customStart && customEnd)) fetchAll();
  }, [filter, customStart, customEnd]);

  function handleFilterChange({ filter: f, start, end }) {
    setFilter(f);
    setCustomStart(start || "");
    setCustomEnd(end || "");
  }

  const ranked = useMemo(() => rankByMetric(leaderStats, category), [leaderStats, category]);
  const topPerformer = ranked.length > 0 && ranked[0][category] > 0 ? ranked[0] : null;
  const yourRank = ranked.find((e) => e.employeeId === yourEmployeeId) || null;
  const activeCategory = CATEGORIES.find((c) => c.key === category);

  return (
    <div className="mb-8">
      <div className="[&_select]:w-full [&_input]:w-full sm:[&_select]:w-auto sm:[&_input]:w-auto">
        <DateFilter value={filter} customStart={customStart} customEnd={customEnd} onChange={handleFilterChange} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard label="Visit Planned" value={stats.visitPlanned} loading={loading} />
        <StatCard label="Visit Done" value={stats.visitDone} loading={loading} />
        <StatCard label="Leads Assigned" value={stats.leadsAssigned} loading={loading} />
        <StatCard label="Total Booking" value={stats.totalBooking} loading={loading} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-white p-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategory(c.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              category === c.key
                ? "bg-amber-100 text-amber-800"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Top Performer</p>
          </div>
          {loadingBoard ? (
            <p className="mt-3 text-sm text-slate-500">Loading…</p>
          ) : topPerformer ? (
            <>
              <p className="mt-3 text-xl font-bold text-slate-900 break-words">{topPerformer.name}</p>
              <p className="mt-1 text-sm font-medium text-amber-700">
                {activeCategory.private
                  ? `Leads on ${activeCategory.label}`
                  : `${topPerformer[category]} ${activeCategory.unit}${topPerformer[category] !== 1 ? "s" : ""} done`}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No activity yet for this range.</p>
          )}
        </div>

        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Your Rank</p>
          {loadingBoard ? (
            <p className="mt-3 text-sm text-slate-500">Loading…</p>
          ) : yourRank ? (
            <>
              <p className="mt-3 text-3xl font-bold text-slate-900">{ordinal(yourRank.rank)} place</p>
              <p className="mt-1 text-sm text-slate-500">out of {ranked.length} employees</p>
              {!activeCategory.private && (
                <p className="mt-2 text-xs text-slate-400">
                  {yourRank[category]} {activeCategory.unit}
                  {yourRank[category] !== 1 ? "s" : ""} · {activeCategory.label}
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Not ranked yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}