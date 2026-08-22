"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DateFilter from "@/app/admin/_components/DateFilter";
import DataTable from "@/app/admin/_components/DataTable";

const TABS = [
  {
    key: "reports",
    label: "Daily Reports",
    endpoint: "/api/team/reports",
    dataKey: "reports",
    columns: [
      { key: "employeeId", label: "Employee ID" },
      { key: "name", label: "Name" },
      { key: "reportDate", label: "Date" },
      { key: "leadsAttended", label: "Leads Attended" },
      { key: "notConnected", label: "Not Connected" },
      { key: "callConnected", label: "Call Connected" },
      { key: "visitPlanned", label: "Visit Planned" },
      { key: "visitManaged", label: "Visit Managed" },
      { key: "meetingDone", label: "Meeting Done" },
      { key: "bookingByCp", label: "Booking By CP" },
      { key: "bookingBySelf", label: "Booking By Self" },
    ],
  },
  {
    key: "visitsPlanned",
    label: "Visit Planned",
    endpoint: "/api/team/visits-planned",
    dataKey: "visits",
    columns: [
      { key: "employeeId", label: "Employee ID" },
      { key: "name", label: "Name" },
      { key: "clientName", label: "Client" },
      { key: "contact", label: "Contact" },
      { key: "project", label: "Project" },
      { key: "visitDate", label: "Visit Date" },
      { key: "timeSlot", label: "Time Slot" },
    ],
  },
  {
    key: "visitsDone",
    label: "Visit Done",
    endpoint: "/api/team/visits-done",
    dataKey: "visits",
    columns: [
      { key: "employeeId", label: "Employee ID" },
      { key: "name", label: "Name" },
      { key: "clientName", label: "Client" },
      { key: "contact", label: "Contact" },
      { key: "project", label: "Project" },
      { key: "visitDate", label: "Visit Date" },
      { key: "status", label: "Status" },
    ],
  },
];

export default function TeamViewClient() {
  const [activeTab, setActiveTab] = useState("reports");
  const [filter, setFilter] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [rows, setRows] = useState([]);
  const [hasTeamAccess, setHasTeamAccess] = useState(true);
  const [loading, setLoading] = useState(true);

  const tab = TABS.find((t) => t.key === activeTab);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const params = new URLSearchParams({ filter });
      if (filter === "custom") {
        if (customStart) params.set("start", customStart);
        if (customEnd) params.set("end", customEnd);
      }
      try {
        const res = await fetch(`${tab.endpoint}?${params}`);
        const data = await res.json();
        setRows(data[tab.dataKey] || []);
        setHasTeamAccess(data.hasTeamAccess !== false);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    if (filter !== "custom" || (customStart && customEnd)) {
      fetchData();
    }
  }, [activeTab, filter, customStart, customEnd]);

  function handleFilterChange({ filter: f, start, end }) {
    setFilter(f);
    setCustomStart(start || "");
    setCustomEnd(end || "");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-slate-900">Team View</h1>
          <p className="mt-1 text-sm text-slate-500">Data for the team(s) you've been granted access to.</p>

          <div className="mt-6 flex gap-1 rounded-md bg-slate-100 p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <DateFilter
              value={filter}
              customStart={customStart}
              customEnd={customEnd}
              onChange={handleFilterChange}
              includeFuture={activeTab === "visitsPlanned"}
            />
          </div>

          <div className="mt-6">
            {!hasTeamAccess ? (
              <p className="py-8 text-center text-sm text-slate-500">
                You don't have access to any team's data yet. Ask your admin to grant access.
              </p>
            ) : loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
            ) : (
              <DataTable columns={tab.columns} rows={rows} filename={`team-${tab.key}`} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}