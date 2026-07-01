"use client";

import { useState } from "react";

export const FILTER_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "lastweek", label: "Last Week" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "thismonth", label: "This Month" },
  { value: "lastmonth", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

export const FUTURE_FILTER_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "next7days", label: "Next 7 Days" },
  { value: "lastweek", label: "Last Week" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "thismonth", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

export default function DateFilter({ value, customStart, customEnd, onChange, includeFuture = false }) {
  const [showCustom, setShowCustom] = useState(value === "custom");
  const options = includeFuture ? FUTURE_FILTER_OPTIONS : FILTER_OPTIONS;

  function handleFilterChange(e) {
    const v = e.target.value;
    setShowCustom(v === "custom");
    onChange({ filter: v, start: customStart, end: customEnd });
  }

  function handleCustomChange(field, val) {
    onChange({ filter: "custom", start: field === "start" ? val : customStart, end: field === "end" ? val : customEnd });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Date range</label>
        <select
          value={value}
          onChange={handleFilterChange}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {showCustom && (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Start date</label>
            <input
              type="date"
              value={customStart || ""}
              onChange={(e) => handleCustomChange("start", e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">End date</label>
            <input
              type="date"
              value={customEnd || ""}
              onChange={(e) => handleCustomChange("end", e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </>
      )}
    </div>
  );
}