import dbConnect from "@/lib/dbConnect";
import Access from "@/models/Access";
import Employee from "@/models/Employee";

/**
 * Returns the caller's lead-visibility/distribution scope:
 *  - { scope: "all" }              → admin, sees/assigns everything
 *  - { scope: "led", teamIds }     → team leader, sees/assigns within these teams (+ own leads)
 *  - { scope: "own" }              → regular employee, sees only leads assigned to them
 *  - { scope: "none" }             → no session
 */
export async function getLeadScope(session) {
  if (!session) return { scope: "none" };
  if (session.role === "admin") return { scope: "all" };

  await dbConnect();

  // Older sessions may predate the token carrying _id — fall back to a
  // lookup by employeeId so a stale token doesn't silently strip
  // distribution rights.
  let granteeId = session._id;
  if (!granteeId && session.employeeId) {
    const emp = await Employee.findOne({ employeeId: session.employeeId }).select("_id").lean();
    granteeId = emp?._id;
  }
  if (!granteeId) return { scope: "own" };

  const grants = await Access.find({ granteeId, scopes: "leadsDistribute" }).lean();
  const teamIds = grants.map((g) => g.teamId.toString());

  if (teamIds.length === 0) return { scope: "own" };
  return { scope: "led", teamIds };
}

/** Mongo query fragment restricting Lead.find() to what this session may view. */
export async function buildLeadVisibilityQuery(session) {
  const scope = await getLeadScope(session);

  if (scope.scope === "all") return {};
  if (scope.scope === "none") return { _id: null }; // matches nothing

  if (scope.scope === "own") {
    return { assignedTo: session.employeeId };
  }

  // "led" — own leads + leads assigned to anyone on a team they lead
  await dbConnect();
  const members = await Employee.find({ teamIds: { $in: scope.teamIds } })
    .select("employeeId")
    .lean();
  const memberIds = members.map((m) => m.employeeId);

  return { $or: [{ assignedTo: session.employeeId }, { assignedTo: { $in: memberIds } }] };
}

/** Backend enforcement — can this session assign a lead to targetEmployeeId? */
export async function canAssignLeadTo(session, targetEmployeeId) {
  if (!session) return false;
  if (session.role === "admin") return true;

  const scope = await getLeadScope(session);
  if (scope.scope !== "led") return false;

  await dbConnect();
  const target = await Employee.findOne({ employeeId: targetEmployeeId }).select("teamIds").lean();
  if (!target) return false;

  return (target.teamIds || []).some((tid) => scope.teamIds.includes(tid.toString()));
}