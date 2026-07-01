import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Employee from "@/models/Employee";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { role, employeeId, password } = body;

  if (password === undefined || password === "") {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  // --- Admin login: password is checked against the ADMIN env var only. ---
  if (role === "admin") {
    if (password !== process.env.ADMIN) {
      return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
    }

    const token = createSessionToken({ role: "admin" });
    const response = NextResponse.json({ ok: true, role: "admin" });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  }

  // --- Employee login: look up employeeId + password in MongoDB. ---
  if (!employeeId) {
    return NextResponse.json({ error: "Employee ID is required." }, { status: 400 });
  }

  try {
    await dbConnect();
    const employee = await Employee.findOne({ employeeId });

    if (!employee || employee.password !== password) {
      return NextResponse.json({ error: "Incorrect employee ID or password." }, { status: 401 });
    }

    const token = createSessionToken({ role: "employee", employeeId });
    const response = NextResponse.json({ ok: true, role: "employee", employeeId });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}