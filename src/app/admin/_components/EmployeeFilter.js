"use client";

export default function EmployeeFilter({ employeeId, employeeName, onChange }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Employee ID</label>
        <input
          type="text"
          value={employeeId}
          onChange={(e) => onChange({ employeeId: e.target.value, employeeName })}
          placeholder="Search by ID"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Employee Name</label>
        <input
          type="text"
          value={employeeName}
          onChange={(e) => onChange({ employeeId, employeeName: e.target.value })}
          placeholder="Search by name"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>
    </div>
  );
}