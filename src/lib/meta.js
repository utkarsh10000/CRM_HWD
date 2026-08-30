const GRAPH_VERSION = "v21.0";

/**
 * Fetches a single lead's data from Meta using its leadgen_id.
 * NOTE: this uses a single page access token from env. If you run ads
 * across multiple Facebook Pages, replace META_PAGE_ACCESS_TOKEN with a
 * lookup by page_id (e.g. a small MetaPageToken collection) — flagging
 * this now so it's a known, deliberate limitation, not a bug.
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