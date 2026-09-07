"use client";

const COLUMNS = [
  { key: "reportDate", label: "Date" },
  { key: "leadsAttended", label: "Leads Attended" },
  { key: "notConnected", label: "Not Connected" },
  { key: "callConnected", label: "Call Connected" },
  { key: "visitPlanned", label: "Visit Planned" },
  { key: "visitManaged", label: "Visit Managed" },
  { key: "meetingDone", label: "Meeting Done" },
  { key: "bookingByCp", label: "Booking by CP" },
  { key: "bookingBySelf", label: "Booking by Self" },
];

export default function DailyBreakdownModal({ employeeName, days, onClose, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{employeeName} — Daily Breakdown</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            ✕
          </button>
        </div>
        <p className="mb-3 text-sm text-slate-500">
          {days.length} day{days.length !== 1 ? "s" : ""} in the selected range.
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {col.label}
                  </th>
                ))}
                {onDelete && (
                  <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {days.map((row, i) => (
                <tr key={row.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-4 py-2.5 text-slate-700">
                      {row[col.key] ?? "—"}
                    </td>
                  ))}
                  {onDelete && (
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => onDelete(row.id)}
                        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}