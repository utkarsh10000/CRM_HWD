"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import EmployeeFilter from "../_components/EmployeeFilter";
import DataTable from "../_components/DataTable";
import { getISTDateString } from "@/lib/istDate";

const COLUMNS = [
  { key: "employeeId", label: "Employee ID" },
  { key: "name", label: "Name" },
  { key: "status", label: "Report Status" },
];

export default function PendingReportsPage() {
  const today = getISTDateString();
  const [date, setDate] = useState(today);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ date });
    if (employeeId) params.set("employeeId", employeeId);
    if (employeeName) params.set("name", employeeName);
    try {
      const res = await fetch(`/api/admin/pending-reports?${params}`);
      const data = await res.json();
      const pending = (data.pending ?? []).map((e) => ({
        ...e,
        status: "Not submitted",
      }));
      setRows(pending);
    } finally {
      setLoading(false);
    }
  }, [date, employeeId, employeeName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleEmployeeChange({ employeeId: id, employeeName: name }) {
    setEmployeeId(id);
    setEmployeeName(name);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/admin" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-slate-900">Pending Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Employees who haven't submitted their daily report.
          </p>

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Date (IST)</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value || today)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <EmployeeFilter employeeId={employeeId} employeeName={employeeName} onChange={handleEmployeeChange} />
          </div>

          <div className="mt-6">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
            ) : (
              <DataTable columns={COLUMNS} rows={rows} filename={`pending-reports-${date}`} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}