"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DateFilter from "../_components/DateFilter";
import EmployeeFilter from "../_components/EmployeeFilter";
import ProjectFilter from "../_components/ProjectFilter";
import DataTable from "../_components/DataTable";

const COLUMNS = [
  { key: "visitDate", label: "Visit Date" },
  { key: "employeeId", label: "Employee ID" },
  { key: "name", label: "Employee Name" },
  { key: "clientName", label: "Client Name" },
  { key: "contact", label: "Contact" },
  { key: "project", label: "Project" },
  { key: "timeSlot", label: "Time Slot" },
  { key: "status", label: "Status" },
];

export default function AdminVisitReportPage() {
  const [filter, setFilter] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [project, setProject] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ filter });
    if (filter === "custom") {
      if (customStart) params.set("start", customStart);
      if (customEnd) params.set("end", customEnd);
    }
    if (employeeId) params.set("employeeId", employeeId);
    if (employeeName) params.set("name", employeeName);
    if (project) params.set("project", project);
    try {
      const res = await fetch(`/api/admin/visit-report?${params}`);
      const data = await res.json();
      setRows(data.visits ?? []);
    } finally {
      setLoading(false);
    }
  }, [filter, customStart, customEnd, employeeId, employeeName, project]);

  useEffect(() => {
    if (filter !== "custom" || (customStart && customEnd)) fetchData();
  }, [filter, customStart, customEnd, fetchData]);

  function handleFilterChange({ filter: f, start, end }) {
    setFilter(f);
    setCustomStart(start || "");
    setCustomEnd(end || "");
  }

  function handleEmployeeChange({ employeeId: id, employeeName: name }) {
    setEmployeeId(id);
    setEmployeeName(name);
  }

  function handleProjectChange({ project: p }) {
    setProject(p);
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/admin/visits/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Link href="/admin" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-slate-900">Visit Report</h1>
          <p className="mt-1 text-sm text-slate-500">All completed visits across all employees.</p>

          <div className="mt-4 flex flex-wrap gap-4">
            <DateFilter value={filter} customStart={customStart} customEnd={customEnd} onChange={handleFilterChange} />
            <EmployeeFilter employeeId={employeeId} employeeName={employeeName} onChange={handleEmployeeChange} />
            <ProjectFilter project={project} onChange={handleProjectChange} />
          </div>

          <div className="mt-6">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
            ) : (
              <DataTable columns={COLUMNS} rows={rows} filename="visit-report" onDelete={handleDelete} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}