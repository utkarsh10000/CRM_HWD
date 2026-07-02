"use client";

const PROJECT_OPTIONS = ["Expressway Residency", "Haute World City", "Haute-1st-Avenue", "Vision - 2028"];

export default function ProjectFilter({ project, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">Project</label>
      <select
        value={project}
        onChange={(e) => onChange({ project: e.target.value })}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        <option value="">All Projects</option>
        {PROJECT_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}