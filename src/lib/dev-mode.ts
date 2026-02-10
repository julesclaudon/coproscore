/** Returns true when dev unlock mode is active (all premium content visible). */
export function isDevUnlocked(): boolean {
  return process.env.NEXT_PUBLIC_DEV_UNLOCK === "true";
}
