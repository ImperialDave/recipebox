import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/firebase/auth-server";
import { getUserGroups } from "@/lib/queries";
import { getPostAuthPath, needsOnboarding } from "@/lib/onboarding";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ profile: null }, { status: 401 });
  }

  const groups = await getUserGroups();

  return NextResponse.json({
    profile,
    group_count: groups.length,
    needs_onboarding: needsOnboarding(profile, groups.length),
    redirect_to: getPostAuthPath(profile, groups.length),
  });
}
