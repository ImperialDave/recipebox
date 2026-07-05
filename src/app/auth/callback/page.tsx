"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  completeMagicLinkSignIn,
  completeMagicLinkSignInWithEmail,
  getStoredMagicLinkEmail,
  isMagicLinkCallback,
} from "@/lib/firebase/auth-client";

async function resolvePostLoginDestination(): Promise<string> {
  const res = await fetch("/api/auth/me");
  const data = await res.json();
  return data.redirect_to === "/onboarding" ? "/onboarding" : "/";
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isMagicLinkCallback()) {
      setError("Invalid or expired sign-in link");
      setLoading(false);
      return;
    }

    const storedEmail = getStoredMagicLinkEmail();
    if (storedEmail) {
      setEmail(storedEmail);
      completeMagicLinkSignIn()
        .then(async () => {
          router.push(await resolvePostLoginDestination());
          router.refresh();
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Sign-in failed");
          setLoading(false);
        });
      return;
    }

    setNeedsEmail(true);
    setLoading(false);
  }, [router]);

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await completeMagicLinkSignInWithEmail(email);
      router.push(await resolvePostLoginDestination());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setSubmitting(false);
    }
  };

  if (needsEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center auth-shell p-4 safe-area-padding">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-subtle">
              <Mail className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="font-serif text-2xl text-center">
              Confirm your email
            </CardTitle>
            <CardDescription className="text-center">
              iPhone and Mail apps sometimes open this link in a fresh tab.
              Enter the same email you used to request the magic link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="callback-email">Email address</Label>
                <Input
                  id="callback-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in..." : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center auth-shell p-4 safe-area-padding">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <a href="/login" className="text-accent hover:underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center auth-shell safe-area-padding">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
        <p className="text-fg-secondary">
          {loading ? "Signing you in..." : "Almost there..."}
        </p>
      </div>
    </div>
  );
}