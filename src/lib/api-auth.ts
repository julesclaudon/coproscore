import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { AccessLevel } from "@/lib/access";

/**
 * Check if the current request has at least the required access level.
 * Returns the actual access level if granted, or null if denied.
 */
export async function checkAccess(required: AccessLevel): Promise<AccessLevel | null> {
  const session = await getServerSession(authOptions);

  let level: AccessLevel = "visitor";
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    level = role === "PRO" || role === "ADMIN" ? "pro" : "free";
  }

  const hierarchy: Record<AccessLevel, number> = { visitor: 0, free: 1, pro: 2 };
  if (hierarchy[level] >= hierarchy[required]) return level;
  return null;
}
