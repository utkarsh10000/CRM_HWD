"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function AssignModal({ lead, employees, onClose, onAssigned }) {
  const [employeeId, setEmployeeId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!employeeId) {
      setError("Select an employee.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      onAssigned();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Assign Lead</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <p className="mb-4 text-sm text-slate-500">{lead.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">Select employee…</option>
              {employees.map((e) => (
                <option key={e.employeeId} value={e.employeeId}>
                  {e.name} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Assigning…" : "Assign"}
          </button>
        </form>
      </div>
    </div>
  );
}

function BulkAssignModal({ leadCount, employees, onClose, onDone }) {
  const [mode, setMode] = useState("single"); // "single" | "split"
  const [employeeId, setEmployeeId] = useState("");
  const [splitIds, setSplitIds] = useState([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggleSplit(id) {
    setSplitIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const body = { mode, reason };
    if (mode === "single") {
      if (!employeeId) {
        setError("Select an employee.");
        return;
      }
      body.employeeId = employeeId;
    } else {
      if (splitIds.length === 0) {
        setError("Select at least one employee to split across.");
        return;
      }
      body.employeeIds = splitIds;
    }

    setSubmitting(true);
    try {
      const result = await onDone(body);
      if (result?.error) setError(result.error);
    } finally {
      setSubmitting(false);
    }
  }

  const perPerson = mode === "split" && splitIds.length > 0 ? Math.ceil(leadCount / splitIds.length) : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Bulk Assign</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <p className="mb-4 text-sm text-slate-500">{leadCount} lead{leadCount !== 1 ? "s" : ""} selected</p>

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-md bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "single" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Assign to One
          </button>
          <button
            type="button"
            onClick={() => setMode("split")}
            className={`rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "split" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Split Across Team
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "single" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Employee</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="">Select employee…</option>
                {employees.map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.name} ({e.employeeId})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Split across</label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
                {employees.map((e) => (
                  <label key={e.employeeId} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={splitIds.includes(e.employeeId)}
                      onChange={() => toggleSplit(e.employeeId)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="text-slate-700">{e.name}</span>
                    <span className="text-xs text-slate-400">{e.employeeId}</span>
                  </label>
                ))}
              </div>
              {perPerson !== null && (
                <p className="mt-1.5 text-xs text-slate-500">
                  ~{perPerson} lead{perPerson !== 1 ? "s" : ""} each, distributed round-robin.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Assigning…" : `Assign ${leadCount} Lead${leadCount !== 1 ? "s" : ""}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LeadsClient() {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [canDistribute, setCanDistribute] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assigningLead, setAssigningLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setCanDistribute(!!data.canDistribute);
      setSelectedIds([]);

      if (data.canDistribute) {
        const empRes = await fetch("/api/leads/assignable-employees");
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  function toggleSelect(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    setSelectedIds(selectedIds.length === leads.length ? [] : leads.map((l) => l.id));
  }

  async function handleBulkSubmit(body) {
    const res = await fetch("/api/leads/bulk-assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds: selectedIds, ...body }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Something went wrong." };

    setShowBulkModal(false);
    const failedNote = data.failed?.length ? ` (${data.failed.length} failed)` : "";
    setToast(`${data.assignedCount} lead${data.assignedCount !== 1 ? "s" : ""} assigned${failedNote}.`);
    setTimeout(() => setToast(""), 4000);
    load();
    return {};
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Leads</h1>
              <p className="mt-1 text-sm text-slate-500">
                {canDistribute ? "Leads you own and your team's leads." : "Leads assigned to you."}
              </p>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
            >
              <option value="">All statuses</option>
              {["new", "contacted", "qualified", "converted", "lost"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {canDistribute && selectedIds.length > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5">
              <span className="text-sm font-medium text-blue-700">
                {selectedIds.length} lead{selectedIds.length !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-xs font-medium text-blue-600 underline hover:no-underline"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Bulk Assign
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
            ) : leads.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No leads found.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {canDistribute && (
                        <th className="whitespace-nowrap px-4 py-2.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === leads.length && leads.length > 0}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </th>
                      )}
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Lead</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Source</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned To</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Team</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                      {canDistribute && (
                        <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l, i) => (
                      <tr key={l.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                        {canDistribute && (
                          <td className="whitespace-nowrap px-4 py-2.5">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(l.id)}
                              onChange={() => toggleSelect(l.id)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                          </td>
                        )}
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{l.name}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700 capitalize">{l.source}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{l.assignedToName}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{l.teamName || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700 capitalize">{l.status}</td>
                        {canDistribute && (
                          <td className="whitespace-nowrap px-4 py-2.5">
                            <button
                              type="button"
                              onClick={() => setAssigningLead(l)}
                              className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                            >
                              Assign
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {assigningLead && (
        <AssignModal
          lead={assigningLead}
          employees={employees}
          onClose={() => setAssigningLead(null)}
          onAssigned={() => {
            setAssigningLead(null);
            load();
          }}
        />
      )}

      {showBulkModal && (
        <BulkAssignModal
          leadCount={selectedIds.length}
          employees={employees}
          onClose={() => setShowBulkModal(false)}
          onDone={handleBulkSubmit}
        />
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-md border border-green-200 bg-white px-4 py-3 text-sm font-medium text-green-700 shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}