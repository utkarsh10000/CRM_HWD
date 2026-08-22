"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SCOPES = [
  { key: "dailyReports", label: "Daily Reports (incl. pending)" },
  { key: "visitsPlanned", label: "Visit Planned" },
  { key: "visitsDone", label: "Visit Done" },
];

export default function ManageAccessClient({ access, grantees, teams }) {
  const router = useRouter();
  const [granteeId, setGranteeId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [scopes, setScopes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  function toggleScope(key) {
    setScopes((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  }

  function startEdit(grant) {
    setEditingId(grant.id);
    setGranteeId(grant.granteeId);
    setTeamId(grant.teamId);
    setScopes(grant.scopes);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setGranteeId("");
    setTeamId("");
    setScopes([]);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!granteeId || !teamId) {
      setError("Pick both a person and a team.");
      return;
    }
    if (scopes.length === 0) {
      setError("Select at least one permission.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ granteeId, teamId, scopes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      const wasEditing = editingId !== null;
      cancelEdit();
      setToast(wasEditing ? "Access updated." : "Access granted.");
      setTimeout(() => setToast(""), 3000);
      router.refresh();
    } catch (err) {
      console.error("Grant access failed:", err);
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(id) {
    const res = await fetch(`/api/admin/access/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (editingId === id) cancelEdit();
      setToast("Access revoked.");
      setTimeout(() => setToast(""), 3000);
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/admin" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-slate-900">Manage Access</h1>
          <p className="mt-1 text-sm text-slate-500">
            Grant a senior or manager visibility into a team's reports and visits.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 p-4">
            {editingId && (
              <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
                <span>Editing existing grant — permissions only.</span>
                <button type="button" onClick={cancelEdit} className="font-medium underline hover:no-underline">
                  Cancel
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Grant to</label>
                <select
                  value={granteeId}
                  onChange={(e) => setGranteeId(e.target.value)}
                  disabled={!!editingId}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Select employee…</option>
                  {grantees.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.employeeId}) — {g.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Team</label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  disabled={!!editingId}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Select team…</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Permissions</label>
              <div className="flex flex-wrap gap-3">
                {SCOPES.map((s) => (
                  <label key={s.key} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={scopes.includes(s.key)}
                      onChange={() => toggleScope(s.key)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving…" : editingId ? "Update Access" : "Grant Access"}
            </button>
          </form>

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Existing Grants</h2>
            {access.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No access grants yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Grantee</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Team</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Permissions</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {access.map((a, i) => (
                      <tr key={a.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">
                          {a.granteeName} <span className="text-xs text-slate-400">({a.granteeEmployeeId})</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{a.teamName}</td>
                        <td className="px-4 py-2.5 text-slate-700">
                          <div className="flex flex-wrap gap-1">
                            {a.scopes.map((s) => (
                              <span key={s} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                                {SCOPES.find((x) => x.key === s)?.label || s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(a)}
                              className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevoke(a.id)}
                              className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-md border border-green-200 bg-white px-4 py-3 text-sm font-medium text-green-700 shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}