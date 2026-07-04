"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createGroup, joinGroup } from "@/lib/actions/groups";
import { updateProfile } from "@/lib/actions/auth";
import { APP_NAME } from "@/lib/constants";
import { toast } from "sonner";

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState<"welcome" | "create" | "join">("welcome");
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const completeOnboarding = async () => {
    await updateProfile({ onboarding_complete: true });
    router.push("/");
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      await createGroup(groupName, groupDesc);
      await completeOnboarding();
      toast.success("Family group created with sample recipes!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create group",
      );
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    try {
      const result = await joinGroup(inviteCode);
      await completeOnboarding();
      toast.success(
        result.alreadyMember ? "Welcome back!" : "Joined the family group!",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid invite code");
      setLoading(false);
    }
  };

  if (step === "welcome") {
    return (
      <div className="min-h-screen flex items-center justify-center auth-shell p-4">
        <div className="w-full max-w-lg text-center">
          <h1 className="font-serif text-4xl font-bold text-fg mb-3">
            Welcome to {APP_NAME}! 🎉
          </h1>
          <p className="text-lg text-fg-secondary mb-8">
            Let&apos;s get your family&apos;s recipe collection started. Create
            a new group or join one you&apos;ve been invited to.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-accent"
              onClick={() => setStep("create")}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle">
                  <Plus className="h-7 w-7 text-accent" />
                </div>
                <CardTitle className="font-serif">
                  Create a Family Group
                </CardTitle>
                <CardDescription>
                  Start fresh with 10 sample recipes to explore
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-warm"
              onClick={() => setStep("join")}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-warm-muted">
                  <Link2 className="h-7 w-7 text-warm" />
                </div>
                <CardTitle className="font-serif">Join a Group</CardTitle>
                <CardDescription>
                  Enter an invite code from a family member
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Button variant="ghost" className="mt-6" onClick={completeOnboarding}>
            Skip for now
          </Button>
        </div>
      </div>
    );
  }

  if (step === "create") {
    return (
      <div className="min-h-screen flex items-center justify-center auth-shell p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-6 w-6 text-accent" />
              <CardTitle className="font-serif text-2xl">
                Create Your Family Group
              </CardTitle>
            </div>
            <CardDescription>
              Give your group a name. We&apos;ll add 10 beloved family recipes
              to get you started!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <Label htmlFor="groupName">Group Name *</Label>
                <Input
                  id="groupName"
                  placeholder="The Smith Family"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="groupDesc">Description (optional)</Label>
                <Textarea
                  id="groupDesc"
                  placeholder="Recipes passed down through generations..."
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("welcome")}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center auth-shell p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            Join a Family Group
          </CardTitle>
          <CardDescription>
            Enter the invite code shared by a family member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinGroup} className="space-y-4">
            <div>
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                placeholder="ABC12345"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                className="mt-1 text-center text-2xl font-mono tracking-widest"
                maxLength={8}
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("welcome")}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Joining..." : "Join Group"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
