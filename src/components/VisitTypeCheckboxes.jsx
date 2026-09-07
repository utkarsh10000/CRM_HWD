"use client";

export default function VisitTypeCheckboxes({ value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">Visit Type</label>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value === "self"}
            onChange={() => onChange("self")}
            className="h-4 w-4 rounded border-slate-300"
          />
          Self
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value === "cp"}
            onChange={() => onChange("cp")}
            className="h-4 w-4 rounded border-slate-300"
          />
          CP
        </label>
      </div>
    </div>
  );
}