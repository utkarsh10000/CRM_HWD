const GRAPH_VERSION = "v21.0";

/**
 * Fetches a single lead's data from Meta using its leadgen_id.
 * NOTE: this uses a single page access token from env. If you run ads
 * across multiple Facebook Pages, replace META_PAGE_ACCESS_TOKEN with a
 * lookup by page_id instead.
 */
export async function fetchMetaLead(leadgenId) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("META_PAGE_ACCESS_TOKEN is not configured.");

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${leadgenId}?access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Meta Graph API error (${res.status}): ${body}`);
  }

  return res.json();
}

/** Meta returns field_data as [{name, values: [...]}] — flatten to {name: value}. */
export function mapMetaFieldData(fieldData = []) {
  const map = {};
  for (const f of fieldData) {
    map[f.name] = Array.isArray(f.values) ? f.values[0] : f.values;
  }
  return map;
}

// Meta's built-in Phone field is usually keyed "phone_number", but custom
// "Phone Number" type questions (common on real estate / hiring forms) are
// saved under whatever label the form author chose, e.g. "contact_number",
// "phone", "whatsapp_number", "mobile" — and their value is often prefixed
// with "p:" to indicate a phone-formatted answer (e.g. "p:+919354565273").
const PHONE_KEY_HINTS = ["phone", "contact_number", "mobile", "whatsapp", "cell", "telephone"];

export function extractPhone(fields) {
  // 1) Exact match on the standard key first.
  if (fields.phone_number) return stripPhonePrefix(fields.phone_number);

  // 2) Otherwise scan every field key for a phone-like hint.
  for (const [key, value] of Object.entries(fields)) {
    const lowerKey = key.toLowerCase();
    if (PHONE_KEY_HINTS.some((hint) => lowerKey.includes(hint))) {
      return stripPhonePrefix(value);
    }
  }

  // 3) Last resort — scan values themselves for Meta's "p:" phone marker,
  //    in case the key name gives no hint at all.
  for (const value of Object.values(fields)) {
    if (typeof value === "string" && value.startsWith("p:")) {
      return stripPhonePrefix(value);
    }
  }

  return "";
}

function stripPhonePrefix(value) {
  if (typeof value !== "string") return "";
  return value.startsWith("p:") ? value.slice(2) : value;
}