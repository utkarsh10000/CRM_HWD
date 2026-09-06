// Voicell's webhook has no publicly documented field schema (unlike Meta's
// Graph API), so instead of hardcoding exact key names — which could be
// wrong and silently drop data — we scan whatever keys actually arrive and
// match by common naming patterns. The full raw payload is always stored
// in ivr.raw regardless, so nothing is ever lost even if a specific field
// isn't recognized by these heuristics.

const NUMBER_HINTS = ["caller", "from", "ani", "cli"];
const CALLED_HINTS = ["called", "to", "dnis", "destination"];
const DURATION_HINTS = ["duration", "billsec", "talktime", "call_time"];
const STATUS_HINTS = ["status", "disposition", "callstatus", "result"];
const RECORDING_HINTS = ["recording", "record_url", "audiourl"];
const CALLID_HINTS = ["call_id", "callid", "uuid", "call_uuid", "session_id", "sessionid", "reference_id", "timestamp", "time", "date"];

function findByHints(fields, hints) {
  for (const [key, value] of Object.entries(fields)) {
    const lowerKey = key.toLowerCase().replace(/[\s_-]/g, "");
    if (hints.some((hint) => lowerKey.includes(hint.replace(/[\s_-]/g, "")))) {
      return value;
    }
  }
  return "";
}

/** Flatten a form-urlencoded body (URLSearchParams) or JSON object into a plain {key: value} map. */
export function normalizeIvrPayload(input) {
  if (input instanceof URLSearchParams) {
    const obj = {};
    for (const [key, value] of input.entries()) obj[key] = value;
    return obj;
  }
  return input || {};
}

export function extractIvrFields(fields) {
  const callerNumber = String(findByHints(fields, NUMBER_HINTS) || "");
  const calledNumber = String(findByHints(fields, CALLED_HINTS) || "");
  const statusRaw = String(findByHints(fields, STATUS_HINTS) || "");
  const recordingUrl = String(findByHints(fields, RECORDING_HINTS) || "");
  const callId = String(findByHints(fields, CALLID_HINTS) || "");

  const durationRaw = findByHints(fields, DURATION_HINTS);
  const durationSeconds = durationRaw !== "" && !isNaN(Number(durationRaw)) ? Number(durationRaw) : null;

  return { callerNumber, calledNumber, callStatus: statusRaw, durationSeconds, recordingUrl, callId };
}