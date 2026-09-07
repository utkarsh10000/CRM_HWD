const NUMERIC_FIELDS = [
  "leadsAttended",
  "notConnected",
  "callConnected",
  "visitPlanned",
  "visitManaged",
  "meetingDone",
  "bookingByCp",
  "bookingBySelf",
];

// Groups a flat list of daily-report rows (one row per employee per day) into
// one totalled row per employee. The original per-day rows are kept on
// `_days` so a UI can pop up the day-by-day breakdown.
export function aggregateReportsByEmployee(reports) {
  const map = new Map();

  for (const r of reports) {
    if (!map.has(r.employeeId)) {
      map.set(r.employeeId, {
        id: r.employeeId,
        employeeId: r.employeeId,
        name: r.name,
        _days: [],
        ...Object.fromEntries(NUMERIC_FIELDS.map((f) => [f, 0])),
      });
    }
    const agg = map.get(r.employeeId);
    agg._days.push(r);
    for (const f of NUMERIC_FIELDS) {
      agg[f] += Number(r[f]) || 0;
    }
  }

  return [...map.values()].map((agg) => {
    agg._days.sort((a, b) => (a.reportDate < b.reportDate ? 1 : -1));
    const sortedDates = agg._days.map((d) => d.reportDate).slice().sort();
    agg.reportDate =
      sortedDates.length === 1
        ? sortedDates[0]
        : `${sortedDates[0]} → ${sortedDates[sortedDates.length - 1]} (${sortedDates.length}d)`;
    agg.dayCount = sortedDates.length;
    return agg;
  });
}

export { NUMERIC_FIELDS };