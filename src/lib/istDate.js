// India does not observe daylight saving, so a fixed +5:30 offset is safe
// to use year-round.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Returns today's date as "YYYY-MM-DD" in IST, regardless of what
// timezone the server itself is running in.
export function getISTDateString(date = new Date()) {
  const istTime = new Date(date.getTime() + IST_OFFSET_MS);
  return istTime.toISOString().slice(0, 10);
}