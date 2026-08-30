"use client";

import Link from "next/link";
import { useState } from "react";

const EMPLOYEE_OPTIONS = [
  {
    href: "/dashboard/reporting",
    title: "Reporting",
    description: "Submit and view your reports.",
  },
  {
    href: "/dashboard/visit-planned",
    title: "Visit Planned",
    description: "See your upcoming scheduled visits.",
  },
  {
    href: "/dashboard/visit-done",
    title: "Visit Done",
    description: "Review visits you've already completed.",
  },
  {
    href: "/dashboard/leads",
    title: "Leads",
    description: "View and work on your assigned leads.",
  },
];

export default function NavLinks() {
  const [loadingHref, setLoadingHref] = useState(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {EMPLOYEE_OPTIONS.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            onClick={(e) => {
              if (loadingHref !== null) {
                e.preventDefault();
                return;
              }
              setLoadingHref(option.href);
            }}
            className={`rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/40 ${
              loadingHref !== null ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <h2 className="text-sm font-semibold text-slate-900">{option.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{option.description}</p>
          </Link>
        ))}
      </div>

      {loadingHref !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-500" />
        </div>
      )}
    </>
  );
}