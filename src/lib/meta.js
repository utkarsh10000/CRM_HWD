const GRAPH_VERSION = "v21.0";

const LEAD_FIELDS = [
  "id",
  "created_time",
  "field_data",
  "campaign_id",
  "campaign_name",
  "adset_id",
  "adset_name",
  "ad_id",
  "ad_name",
  "form_id",
  "platform",
].join(",");

export async function fetchMetaLead(leadgenId) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("META_PAGE_ACCESS_TOKEN is not configured.");

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${leadgenId}?fields=${LEAD_FIELDS}&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Meta Graph API error (${res.status}): ${body}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return res.json();
}

export function mapMetaFieldData(fieldData = []) {
  const map = {};
  for (const f of fieldData) {
    map[f.name] = Array.isArray(f.values) ? f.values[0] : f.values;
  }
  return map;
}

const PHONE_KEY_HINTS = ["phone", "contact_number", "mobile", "whatsapp", "cell", "telephone"];

export function extractPhone(fields) {
  if (fields.phone_number) return stripPhonePrefix(fields.phone_number);
  if (fields.phone) return stripPhonePrefix(fields.phone);

  for (const [key, value] of Object.entries(fields)) {
    const lowerKey = key.toLowerCase();
    if (PHONE_KEY_HINTS.some((hint) => lowerKey.includes(hint))) {
      return stripPhonePrefix(value);
    }
  }
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