import { GroupDetailClient } from "./group-detail-client";
import {
  getGroup,
  getGroupMembers,
  getRecipes,
  getCurrentUser,
} from "@/lib/queries";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [group, members, recipes] = await Promise.all([
    getGroup(id),
    getGroupMembers(id),
    getRecipes({ groupId: id }),
  ]);

  if (!group) notFound();

  const currentMember = members.find((m) => m.user_id === user.id);
  if (!currentMember) redirect("/groups");

  return (
    <GroupDetailClient
      group={group}
      members={members}
      recipes={recipes}
      currentUserRole={currentMember.role}
      currentUserId={user.id}
    />
  );
}
