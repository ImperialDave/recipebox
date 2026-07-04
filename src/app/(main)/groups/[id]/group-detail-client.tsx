"use client";

import { useState } from "react";
import { Copy, Check, Users, Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppHeader } from "@/components/layout/app-header";
import { RecipeCard } from "@/components/recipes/recipe-card";
import {
  updateMemberRole,
  removeMember,
  leaveGroup,
  deleteGroup,
} from "@/lib/actions/groups";
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type GroupRole,
} from "@/lib/constants";
import type { FamilyGroup, GroupMember, Recipe } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GroupDetailClientProps {
  group: FamilyGroup;
  members: GroupMember[];
  recipes: Recipe[];
  currentUserRole: GroupRole;
  currentUserId: string;
}

export function GroupDetailClient({
  group,
  members,
  recipes,
  currentUserRole,
  currentUserId,
}: GroupDetailClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const isAdmin = currentUserRole === "admin";

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${group.invite_code}`
      : `/join/${group.invite_code}`;

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = async (memberId: string, role: GroupRole) => {
    try {
      await updateMemberRole(group.id, memberId, role);
      toast.success("Role updated");
      router.refresh();
    } catch {
      toast.error("Could not update role");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(group.id, memberId);
      toast.success("Member removed");
      router.refresh();
    } catch {
      toast.error("Could not remove member");
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroup(group.id);
      toast.success("Left the group");
      router.push("/groups");
    } catch {
      toast.error("Could not leave group");
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(group.id);
      toast.success("Group deleted");
      router.push("/groups");
    } catch {
      toast.error("Could not delete group");
    }
  };

  return (
    <>
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-fg">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-fg-secondary mt-2 text-lg">
                {group.description}
              </p>
            )}
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link2 className="h-5 w-5" />
                Invite Family Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 flex-wrap">
                <code className="px-4 py-2 bg-overlay rounded-xl font-mono text-lg tracking-widest">
                  {group.invite_code}
                </code>
                <Button onClick={copyInvite} variant="outline">
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? "Copied!" : "Copy Invite Link"}
                </Button>
              </div>
              <p className="text-sm text-fg-secondary mt-3">
                Share this code or link with family members so they can join
                your group.
              </p>
            </CardContent>
          </Card>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-semibold text-fg mb-4 flex items-center gap-2">
              <Users className="h-6 w-6" />
              Members ({members.length})
            </h2>
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-elevated border border-border"
                >
                  <Avatar>
                    <AvatarImage
                      src={member.profile?.avatar_url || undefined}
                    />
                    <AvatarFallback>
                      {member.profile?.full_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-fg">
                      {member.profile?.full_name ||
                        member.profile?.email ||
                        "Member"}
                    </div>
                    <div className="text-sm text-fg-secondary">
                      {ROLE_DESCRIPTIONS[member.role as GroupRole]}
                    </div>
                  </div>
                  {isAdmin && member.user_id !== currentUserId ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(v) =>
                          handleRoleChange(member.id, v as GroupRole)
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline">
                      {ROLE_LABELS[member.role as GroupRole]}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-semibold text-fg mb-4">
              Shared Recipes ({recipes.length})
            </h2>
            {recipes.length === 0 ? (
              <p className="text-fg-secondary">
                No recipes shared with this group yet.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
          </section>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleLeave}>
              Leave Group
            </Button>
            {isAdmin && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialog(true)}
              >
                Delete Group
              </Button>
            )}
          </div>
        </div>
      </main>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{group.name}&quot;?</DialogTitle>
            <DialogDescription>
              This will permanently delete the group and remove all shared
              recipe links. Recipes themselves won&apos;t be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup}>
              Delete Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
