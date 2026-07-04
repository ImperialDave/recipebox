"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { joinGroup } from "@/lib/actions/groups";
import { toast } from "sonner";
import Link from "next/link";

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    try {
      const result = await joinGroup(code);
      setJoined(true);
      toast.success(
        result.alreadyMember
          ? "You're already a member!"
          : "Welcome to the family!",
      );
      setTimeout(() => router.push(`/groups/${result.groupId}`), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not join group");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-shell p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-subtle">
            <Users className="h-8 w-8 text-accent" />
          </div>
          <CardTitle className="font-serif text-2xl">
            Join a Family Group
          </CardTitle>
          <CardDescription className="text-base">
            You&apos;ve been invited to join a family recipe group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <code className="block px-4 py-3 bg-overlay rounded-xl font-mono text-2xl tracking-widest">
            {code}
          </code>
          {joined ? (
            <p className="text-accent font-medium">
              Redirecting to your group...
            </p>
          ) : (
            <>
              <Button
                onClick={handleJoin}
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Joining..." : "Join Group"}
              </Button>
              <p className="text-sm text-fg-secondary">
                <Link href="/login" className="text-accent hover:underline">
                  Sign in
                </Link>{" "}
                first if you don&apos;t have an account
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
