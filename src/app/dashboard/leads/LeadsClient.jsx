"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {sub && <p className={`mt-1 text-xs font-medium ${accent || "text-slate-400"}`}>{sub}</p>}
    </div>
  );
}

const STATUS_OPTIONS = ["new", "contacted", "qualified", "converted", "lost"];

// Fields already shown elsewhere in the modal — skip them here so they're
// not repeated under Form Answers.
const HIDDEN_META_KEYS = new Set(["full_name", "first_name", "last_name", "phone", "phone_number", "email"]);

function prettifyLabel(key) {
  return key
    .replace(/\?$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMetaAnswers(customFields) {
  if (!customFields) return [];
  return Object.entries(customFields)
    .filter(([key, value]) => !HIDDEN_META_KEYS.has(key.toLowerCase()) && value)
    .map(([key, value]) => [prettifyLabel(key), String(value).replace(/^p:/, "")]);
}

function LeadDetailModal({ leadId, onClose, onUpdated }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const data = await res.json();
      setLead(data.lead || null);
      setStatus(data.lead?.status || "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [leadId]);

  async function handleSave() {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const body = {};
      if (status && status !== lead.status) body.status = status;
      if (remark.trim()) body.note = remark.trim();

      if (Object.keys(body).length === 0) {
        setError("Change the status or add a remark before saving.");
        return;
      }

      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setRemark("");
      setSaved(true);
      await load();
      onUpdated?.();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Lead Details</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
        ) : !lead ? (
          <p className="py-8 text-center text-sm text-slate-500">Lead not found.</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-slate-400">Name</p><p className="text-slate-800">{lead.name}</p></div>
              <div><p className="text-xs text-slate-400">Source</p><p className="text-slate-800 capitalize">{lead.source}</p></div>
              <div><p className="text-xs text-slate-400">Phone</p><p className="text-slate-800">{lead.phone || "—"}</p></div>
              <div><p className="text-xs text-slate-400">Email</p><p className="text-slate-800">{lead.email || "—"}</p></div>
              <div><p className="text-xs text-slate-400">Assigned To</p><p className="text-slate-800">{lead.assignedToName}</p></div>
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Update Lead</p>

              <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mb-3 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 capitalize focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>

              <label className="mb-1 block text-xs font-medium text-slate-600">Add Remark</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={2}
                placeholder="e.g. Called, interested in 2BHK, follow up next week"
                className="mb-3 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />

              {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
              {saved && <p className="mb-2 text-xs text-green-600">Saved.</p>}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Update"}
              </button>
            </div>

            {lead.source === "meta" && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Meta Ad Details</p>
                <div className="rounded-md border border-slate-200 p-3 text-sm">
                  {lead.meta?.submittedAt && (
                    <p className="mb-2 text-xs text-slate-500">
                      Submitted {new Date(lead.meta.submittedAt).toLocaleString()}
                    </p>
                  )}
                  {formatMetaAnswers(lead.meta?.customFields).length > 0 ? (
                    <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                      {formatMetaAnswers(lead.meta?.customFields).map(([label, value]) => (
                        <div key={label}>
                          <p className="text-xs text-slate-400">{label}</p>
                          <p className="text-slate-800">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No additional form answers.</p>
                  )}
                </div>
              </div>
            )}

            {lead.assignmentHistory?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Assignment History</p>
                <div className="space-y-2">
                  {lead.assignmentHistory.map((h, i) => (
                    <div key={i} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <span className="font-medium text-slate-800">{h.byName}</span> assigned to{" "}
                      <span className="font-medium text-slate-800">{h.toName}</span>
                      {h.reason && <span> — {h.reason}</span>}
                      <div className="mt-0.5 text-slate-400">{new Date(h.at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lead.notes?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Remarks / Notes</p>
                <div className="space-y-2">
                  {lead.notes.map((n, i) => (
                    <div key={i} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      {n.text}
                      <div className="mt-0.5 text-slate-400">{n.byEmployeeId} — {new Date(n.at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
  const [mode, setMode] = useState("single");
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
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
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

const STATUS_STYLES = {
  new: "bg-blue-50 text-blue-700",
  contacted: "bg-amber-50 text-amber-700",
  qualified: "bg-purple-50 text-purple-700",
  converted: "bg-green-50 text-green-700",
  lost: "bg-slate-100 text-slate-500",
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

const SOURCE_STYLES = {
  meta: "bg-indigo-50 text-indigo-700",
  website: "bg-cyan-50 text-cyan-700",
  manual: "bg-slate-100 text-slate-600",
  other: "bg-slate-100 text-slate-600",
};

function SourceBadge({ source }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${SOURCE_STYLES[source] || "bg-slate-100 text-slate-600"}`}>
      {source === "meta" ? "Meta" : source}
    </span>
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
  const [viewingLeadId, setViewingLeadId] = useState(null);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");

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
    setSelectedIds(selectedIds.length === filteredLeads.length ? [] : filteredLeads.map((l) => l.id));
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

  const filteredLeads = search
    ? leads.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          (l.phone || "").includes(search) ||
          (l.email || "").toLowerCase().includes(search.toLowerCase())
      )
    : leads;

  const totalCount = leads.length;
  const newCount = leads.filter((l) => l.status === "new").length;
  const convertedCount = leads.filter((l) => l.status === "converted").length;
  const metaCount = leads.filter((l) => l.source === "meta").length;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>

        <div className="mb-6 mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
            <p className="mt-1 text-sm text-slate-500">
              {canDistribute ? "Leads you own and your team's leads." : "Leads assigned to you."}
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Leads" value={totalCount} />
          <StatCard label="New" value={newCount} sub="Needs first contact" accent="text-blue-600" />
          <StatCard label="Converted" value={convertedCount} sub="Closed won" accent="text-green-600" />
          <StatCard label="From Meta" value={metaCount} sub="Facebook & Instagram" accent="text-indigo-600" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, email…"
                className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
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
              <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5">
                <span className="text-xs font-medium text-blue-700">
                  {selectedIds.length} selected
                </span>
                <button type="button" onClick={() => setSelectedIds([])} className="text-xs font-medium text-blue-600 underline hover:no-underline">
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Bulk Assign
                </button>
              </div>
            )}
          </div>

          <div className="mt-5">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
            ) : filteredLeads.length === 0 ? (
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
                            checked={selectedIds.length === filteredLeads.length && filteredLeads.length > 0}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </th>
                      )}
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Lead</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
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
                    {filteredLeads.map((l, i) => (
                      <tr key={l.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-blue-50/30`}>
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
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => setViewingLeadId(l.id)}
                            className="font-medium text-slate-800 hover:text-blue-600 hover:underline"
                          >
                            {l.name}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{l.phone || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{l.email || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-2.5"><SourceBadge source={l.source} /></td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{l.assignedToName}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{l.teamName || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-2.5"><StatusBadge status={l.status} /></td>
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

      {viewingLeadId && (
        <LeadDetailModal leadId={viewingLeadId} onClose={() => setViewingLeadId(null)} onUpdated={load} />
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-md border border-green-200 bg-white px-4 py-3 text-sm font-medium text-green-700 shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}