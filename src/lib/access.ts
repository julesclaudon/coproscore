import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type AccessLevel = "visitor" | "free" | "pro";

export async function getAccessLevel(): Promise<AccessLevel> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return "visitor";

  const role = (session.user as { role?: string }).role;
  if (role === "PRO" || role === "ADMIN") return "pro";
  return "free";
}
