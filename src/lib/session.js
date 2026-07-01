import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("Missing JWT_SECRET environment variable.");
}

export const SESSION_COOKIE = "crm_session";

export function createSessionToken(payload) {
  // payload example: { role: "employee", employeeId: "EMP-1024" }
  // or: { role: "admin" }
  return jwt.sign(payload, SECRET, { expiresIn: "8h" });
}

export function verifySessionToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

// Reads and verifies the session cookie in one step. Use this in
// server components and route handlers instead of repeating the
// cookies() + verify dance everywhere.
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}
