import dbConnect from "@/lib/dbConnect";
import Access from "@/models/Access";
import Employee from "@/models/Employee";

/**
 * Returns the list of employeeId strings the session user is allowed to see
 * data for, given a scope ("dailyReports" | "visitsPlanned" | "visitsDone").
 * Returns null if the user is admin — meaning no restriction, see everyone.
 * Otherwise always includes the user's own employeeId.
 */
export async function getVisibleEmployeeIds(session, scope) {
  if (!session) return [];
  if (session.role === "admin") return null;

  await dbConnect();

  const grants = await Access.find({ granteeId: session._id, scopes: scope }).lean();
  const teamIds = grants.map((g) => g.teamId);

  if (teamIds.length === 0) return [session.employeeId];

  const members = await Employee.find({ teamIds: { $in: teamIds } })
    .select("employeeId")
    .lean();

  const ids = new Set(members.map((m) => m.employeeId));
  ids.add(session.employeeId);
  return [...ids];
}