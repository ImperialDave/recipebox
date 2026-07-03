"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  signInWithPasswordClient,
  sendMagicLinkClient,
} from "@/lib/firebase/auth-client";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await sendMagicLinkClient(email);
      setMagicSent(true);
      toast.success("Check your email for the magic link!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send link");
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInWithPasswordClient(email, password);
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  if (magicSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-100">
              <Mail className="h-8 w-8 text-sage-600" />
            </div>
            <CardTitle className="font-serif text-2xl">Check your email</CardTitle>
            <CardDescription className="text-base">
              We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setMagicSent(false)}>
              Try a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-600 text-white">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-brown-800">{APP_NAME}</h1>
          <p className="text-brown-500 mt-1">{APP_TAGLINE}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your family recipe collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <Button
                variant={mode === "magic" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setMode("magic")}
              >
                <Mail className="h-4 w-4 mr-1" />
                Magic Link
              </Button>
              <Button
                variant={mode === "password" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setMode("password")}
              >
                <Lock className="h-4 w-4 mr-1" />
                Password
              </Button>
            </div>

            <form onSubmit={mode === "magic" ? handleMagicLink : handlePassword} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              {mode === "password" && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Please wait..." : mode === "magic" ? "Send Magic Link" : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-brown-500 mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-sage-600 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}