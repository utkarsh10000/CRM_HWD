"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const EMPLOYEE_ID_PREFIX = "HD/EMP/";
const ROLES = ["employee", "senior", "manager", "admin"];

function EmployeeIdInput({ value, onChange }) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-md border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30">
      <span className="flex items-center bg-slate-50 px-3 text-sm font-medium text-slate-500 select-none">
        {EMPLOYEE_ID_PREFIX}
      </span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]{3}"
        maxLength={3}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 3))}
        placeholder="019"
        className="w-full border-0 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
      />
    </div>
  );
}

function RoleSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r.charAt(0).toUpperCase() + r.slice(1)}
        </option>
      ))}
    </select>
  );
}

function TeamPicker({ teams, selectedIds, onChange }) {
  function toggle(id) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  if (teams.length === 0) {
    return <p className="text-xs text-slate-400">No teams yet — create one under Manage Teams.</p>;
  }

  return (
    <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
      {teams.map((t) => (
        <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
          <input
            type="checkbox"
            checked={selectedIds.includes(t.id)}
            onChange={() => toggle(t.id)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="text-slate-700">{t.name}</span>
        </label>
      ))}
    </div>
  );
}

function AddEmployeeModal({ teams, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [teamIds, setTeamIds] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !idNumber || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    const employeeId = `${EMPLOYEE_ID_PREFIX}${idNumber.padStart(3, "0")}`;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, employeeId, password, role, teamIds }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }

      onSaved?.();
    } catch (err) {
      console.error("Add employee failed:", err);
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Add Employee</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Employee's full name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Employee ID</label>
            <EmployeeIdInput value={idNumber} onChange={setIdNumber} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set a password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
            <RoleSelect value={role} onChange={setRole} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Teams</label>
            <TeamPicker teams={teams} selectedIds={teamIds} onChange={setTeamIds} />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Adding…" : "Add Employee"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditEmployeeModal({ employee, teams, onClose, onSaved }) {
  const [name, setName] = useState(employee.name);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(employee.role || "employee");
  const [teamIds, setTeamIds] = useState(employee.teamIds || []);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name can't be empty.");
      return;
    }

    setSubmitting(true);
    try {
      const body = { name, role, teamIds };
      if (password.trim()) body.password = password;

      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }

      onSaved?.();
    } catch (err) {
      console.error("Edit employee failed:", err);
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Edit Employee</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Employee ID</label>
            <input
              type="text"
              value={employee.employeeId}
              disabled
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">New Password</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
            <RoleSelect value={role} onChange={setRole} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Teams</label>
            <TeamPicker teams={teams} selectedIds={teamIds} onChange={setTeamIds} />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ employee, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => !deleting && onClose()}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-slate-900">Delete this employee?</h3>
        <p className="mt-2 text-sm text-slate-500">
          This will permanently delete <span className="font-medium text-slate-700">{employee.name}</span> ({employee.employeeId}). This action cannot be undone.
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

export default function ManageEmployeesClient({ employees, teams }) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [deleteEmployee, setDeleteEmployee] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleAdded() {
    setShowAddModal(false);
    setToast("Employee added.");
    router.refresh();
  }

  function handleEdited() {
    setEditEmployee(null);
    setToast("Employee updated.");
    router.refresh();
  }

  async function handleDeleteConfirm() {
    if (!deleteEmployee) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/employees/${deleteEmployee.id}`, { method: "DELETE" });
      if (res.ok) {
        setToast("Employee deleted.");
        router.refresh();
      }
    } finally {
      setDeleting(false);
      setDeleteEmployee(null);
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
              <h1 className="text-lg font-semibold text-slate-900">Manage Employees</h1>
              <p className="mt-1 text-sm text-slate-500">Add, edit, or remove employee accounts.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              + Add Employee
            </button>
          </div>

          <div className="mt-6">
            {employees.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No employees yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Employee ID</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Teams</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp, i) => (
                      <tr key={emp.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{emp.employeeId}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{emp.name}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700 capitalize">{emp.role}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">
                          {teams.filter((t) => emp.teamIds.includes(t.id)).map((t) => t.name).join(", ") || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => setEditEmployee(emp)} className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600" aria-label="Edit employee">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button type="button" onClick={() => setDeleteEmployee(emp)} className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" aria-label="Delete employee">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                              </svg>
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

      {showAddModal && <AddEmployeeModal teams={teams} onClose={() => setShowAddModal(false)} onSaved={handleAdded} />}
      {editEmployee && <EditEmployeeModal employee={editEmployee} teams={teams} onClose={() => setEditEmployee(null)} onSaved={handleEdited} />}
      {deleteEmployee && (
        <DeleteConfirmModal employee={deleteEmployee} onClose={() => setDeleteEmployee(null)} onConfirm={handleDeleteConfirm} deleting={deleting} />
      )}
    </main>
  );
}