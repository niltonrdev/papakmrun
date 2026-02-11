export const ROLES = {
  ADMIN: "admin",
  COACH: "coach",
  PLAN: "plan",
  SOCIAL: "social",
};

export function canAccess(role, area) {
  // V1: liberado (a gente fecha isso quando entrar auth)
  return true;
}
