"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppHeader } from "@/components/layout/app-header";
import { useTheme } from "@/components/providers/theme-provider";
import { updateProfile } from "@/lib/actions/auth";
import { signOutClient } from "@/lib/firebase/auth-client";
import { BackupCard } from "@/components/settings/backup-card";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, textSize, setTextSize } = useTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setFullName(data.profile.full_name || "");
          setEmail(data.profile.email || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName });
      toast.success("Profile updated");
    } catch {
      toast.error("Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOutClient();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-lg mx-auto space-y-6">
          <h1 className="font-serif text-3xl font-bold text-fg">Settings</h1>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your name and account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="mt-1 opacity-60"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the app looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <p className="text-sm text-fg-secondary">
                  Choose light, dark, or match your device
                </p>
                <Select
                  value={theme}
                  onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark (Evening Kitchen)</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Large Text</Label>
                  <p className="text-sm text-fg-secondary">
                    Bigger, easier-to-read text
                  </p>
                </div>
                <Switch
                  checked={textSize === "large"}
                  onCheckedChange={(checked) =>
                    setTextSize(checked ? "large" : "normal")
                  }
                />
              </div>
            </CardContent>
          </Card>

          <BackupCard />

          <Card>
            <CardContent className="pt-6">
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="w-full"
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
