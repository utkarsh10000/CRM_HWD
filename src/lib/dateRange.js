import { getISTDateString } from "./istDate";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Returns a { start: Date, end: Date } range for a given filter string.
// All ranges are computed in IST and converted to UTC for MongoDB queries.
export function getDateRange(filter = "today", customStart = null, customEnd = null) {
  const nowIST = new Date(Date.now() + IST_OFFSET_MS);
  const todayStr = getISTDateString();

  function startOfDay(dateStr) {
    return new Date(new Date(`${dateStr}T00:00:00.000Z`).getTime() - IST_OFFSET_MS);
  }
  function endOfDay(dateStr) {
    return new Date(new Date(`${dateStr}T23:59:59.999Z`).getTime() - IST_OFFSET_MS);
  }
  function addDays(dateStr, n) {
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  switch (filter) {
    case "today":
      return { start: startOfDay(todayStr), end: endOfDay(todayStr) };

    case "yesterday": {
      const y = addDays(todayStr, -1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }

    case "last7days": {
      const s = addDays(todayStr, -6);
      return { start: startOfDay(s), end: endOfDay(todayStr) };
    }

    case "lastweek": {
      // Mon–Sun of the previous ISO week
      const dayOfWeek = nowIST.getUTCDay() || 7;
      const monday = addDays(todayStr, -(dayOfWeek - 1) - 7);
      const sunday = addDays(monday, 6);
      return { start: startOfDay(monday), end: endOfDay(sunday) };
    }

    case "thismonth": {
      const first = `${todayStr.slice(0, 7)}-01`;
      return { start: startOfDay(first), end: endOfDay(todayStr) };
    }

    case "lastmonth": {
      const d = new Date(`${todayStr}T00:00:00.000Z`);
      d.setUTCMonth(d.getUTCMonth() - 1);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const lastDay = new Date(Date.UTC(year, d.getUTCMonth() + 1, 0));
      const first = `${year}-${month}-01`;
      const last = lastDay.toISOString().slice(0, 10);
      return { start: startOfDay(first), end: endOfDay(last) };
    }

    // Visit Planned only
    case "tomorrow":
      return { start: startOfDay(addDays(todayStr, 1)), end: endOfDay(addDays(todayStr, 1)) };

    case "next7days": {
      const s = addDays(todayStr, 1);
      const e = addDays(todayStr, 7);
      return { start: startOfDay(s), end: endOfDay(e) };
    }

    case "custom": {
      if (!customStart || !customEnd) return null;
      return { start: startOfDay(customStart), end: endOfDay(customEnd) };
    }

    default:
      return { start: startOfDay(todayStr), end: endOfDay(todayStr) };
  }
}