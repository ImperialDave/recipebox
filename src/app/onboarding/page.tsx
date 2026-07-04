import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/firebase/auth-server";
import { getUserGroups } from "@/lib/queries";
import { needsOnboarding } from "@/lib/onboarding";
import { updateProfile } from "@/lib/actions/auth";
import OnboardingClient from "./onboarding-client";

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const groups = await getUserGroups();
  if (!needsOnboarding(profile, groups.length)) {
    if (!profile.onboarding_complete && groups.length > 0) {
      await updateProfile({ onboarding_complete: true });
    }
    redirect("/");
  }

  return <OnboardingClient />;
}
