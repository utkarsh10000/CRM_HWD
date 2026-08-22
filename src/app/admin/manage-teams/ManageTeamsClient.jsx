"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function MemberPicker({ employees, selectedIds, onChange }) {
  function toggle(id) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  return (
    <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
      {employees.length === 0 ? (
        <p className="px-1 py-2 text-sm text-slate-400">No employees yet.</p>
      ) : (
        employees.map((emp) => (
          <label
            key={emp.id}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(emp.id)}
              onChange={() => toggle(emp.id)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="text-slate-700">{emp.name}</span>
            <span className="text-xs text-slate-400">{emp.employeeId}</span>
          </label>
        ))
      )}
    </div>
  );
}

function TeamModal({ title, initialName, initialMemberIds, employees, onClose, onSubmit, submitLabel }) {
  const [name, setName] = useState(initialName);
  const [memberIds, setMemberIds] = useState(initialMemberIds);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Team name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), memberIds });
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales - North Zone"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Members</label>
            <MemberPicker employees={employees} selectedIds={memberIds} onChange={setMemberIds} />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ team, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => !deleting && onClose()}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-slate-900">Delete this team?</h3>
        <p className="mt-2 text-sm text-slate-500">
          This will permanently delete <span className="font-medium text-slate-700">{team.name}</span> and any access
          grants tied to it. This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={deleting} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={deleting} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageTeamsClient({ teams, employees }) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [deleteTeam, setDeleteTeam] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleCreate({ name, memberIds }) {
    const res = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, memberIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setShowAddModal(false);
    setToast("Team created.");
    router.refresh();
  }

  async function handleEdit({ name, memberIds }) {
    const res = await fetch(`/api/admin/teams/${editTeam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, memberIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setEditTeam(null);
    setToast("Team updated.");
    router.refresh();
  }

  async function handleDeleteConfirm() {
    if (!deleteTeam) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/teams/${deleteTeam.id}`, { method: "DELETE" });
      if (res.ok) {
        setToast("Team deleted.");
        router.refresh();
      }
    } finally {
      setDeleting(false);
      setDeleteTeam(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/admin" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Manage Teams</h1>
              <p className="mt-1 text-sm text-slate-500">Create teams and assign members.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Create Team
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {teams.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500 sm:col-span-2">No teams yet.</p>
            ) : (
              teams.map((team) => (
                <div key={team.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">{team.name}</h3>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setEditTeam(team)} className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600" aria-label="Edit team">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => setDeleteTeam(team)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete team">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {team.memberIds.length} member{team.memberIds.length !== 1 ? "s" : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {employees
                      .filter((e) => team.memberIds.includes(e.id))
                      .map((e) => (
                        <span key={e.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {e.name}
                        </span>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-md border border-green-200 bg-white px-4 py-3 text-sm font-medium text-green-700 shadow-lg">
          {toast}
        </div>
      )}

      {showAddModal && (
        <TeamModal
          title="Create Team"
          initialName=""
          initialMemberIds={[]}
          employees={employees}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreate}
          submitLabel="Create Team"
        />
      )}
      {editTeam && (
        <TeamModal
          title="Edit Team"
          initialName={editTeam.name}
          initialMemberIds={editTeam.memberIds}
          employees={employees}
          onClose={() => setEditTeam(null)}
          onSubmit={handleEdit}
          submitLabel="Save Changes"
        />
      )}
      {deleteTeam && (
        <DeleteConfirmModal team={deleteTeam} onClose={() => setDeleteTeam(null)} onConfirm={handleDeleteConfirm} deleting={deleting} />
      )}
    </main>
  );
}