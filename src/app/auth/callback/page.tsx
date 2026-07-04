"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeMagicLinkSignIn } from "@/lib/firebase/auth-client";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    completeMagicLinkSignIn()
      .then(async () => {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        const destination =
          data.redirect_to === "/onboarding" ? "/onboarding" : "/";
        router.push(destination);
        router.refresh();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Sign-in failed");
      });
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center auth-shell p-4">
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
    <div className="min-h-screen flex items-center justify-center auth-shell">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
        <p className="text-fg-secondary dark:text-fg-secondary">
          Signing you in...
        </p>
      </div>
    </div>
  );
}
