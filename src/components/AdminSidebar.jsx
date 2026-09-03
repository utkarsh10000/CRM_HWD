"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_SECTIONS = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard" }] },
  {
    label: "Team",
    items: [
      { href: "/admin/manage-employees", label: "Manage Employees" },
      { href: "/admin/manage-teams", label: "Manage Teams" },
      { href: "/admin/manage-access", label: "Manage Access" },
    ],
  },
  {
    label: "Reports & Data",
    items: [
      { href: "/admin/productivity-report", label: "Productivity Report" },
      { href: "/admin/visit-report", label: "Visit Report" },
      { href: "/admin/visit-planned", label: "Visit Planned" },
      { href: "/admin/pending-reports", label: "Pending Reports" },
    ],
  },
  { label: "Leads", items: [{ href: "/admin/leads", label: "Leads" }] },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-sm font-semibold text-slate-900">CRM Admin</p>
        <p className="mt-0.5 text-xs text-slate-400">Haute World Developers</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </aside>
  );
}