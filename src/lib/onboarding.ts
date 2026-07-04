import type { Profile } from "@/lib/types";

export function needsOnboarding(profile: Profile, groupCount: number): boolean {
  if (profile.onboarding_complete) return false;
  if (groupCount > 0) return false;
  return true;
}

export function getPostAuthPath(
  profile: Profile,
  groupCount: number,
): "/onboarding" | "/" {
  return needsOnboarding(profile, groupCount) ? "/onboarding" : "/";
}
