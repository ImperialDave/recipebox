import Link from "next/link";
import { Plus, Users, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/layout/app-header";
import { getCurrentUser, getUserGroups } from "@/lib/queries";
import { ROLE_LABELS } from "@/lib/constants";
import { redirect } from "next/navigation";

export default async function GroupsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups();

  return (
    <>
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-brown-800">Family Groups</h1>
              <p className="text-brown-500 mt-1">Share recipes safely with your loved ones</p>
            </div>
            <Link href="/groups/new">
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                New Group
              </Button>
            </Link>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
              <h2 className="font-serif text-2xl font-semibold text-brown-800 mb-2">
                No family groups yet
              </h2>
              <p className="text-brown-500 mb-6 max-w-md mx-auto">
                Create a group to start sharing recipes with your family, or join one with an invite code.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/groups/new">
                  <Button size="lg">Create Group</Button>
                </Link>
                <Link href="/join">
                  <Button variant="outline" size="lg">Join with Code</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {groups.map((group) => (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-100 shrink-0">
                        <Users className="h-7 w-7 text-sage-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="font-serif truncate">{group.name}</CardTitle>
                          <Badge variant="outline">{ROLE_LABELS[group.role as keyof typeof ROLE_LABELS]}</Badge>
                        </div>
                        {group.description && (
                          <CardDescription className="line-clamp-1 mt-1">
                            {group.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="text-xs text-brown-400 font-mono shrink-0 hidden sm:block">
                        {group.invite_code}
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}