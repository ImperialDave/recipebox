import { AppHeader } from "@/components/layout/app-header";
import { NewRecipeClient } from "./new-recipe-client";
import { getCurrentUser, getUserGroups } from "@/lib/queries";
import { redirect } from "next/navigation";

export default async function NewRecipePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups();

  return (
    <>
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <NewRecipeClient
            groups={groups.map((g) => ({ id: g.id, name: g.name }))}
          />
        </div>
      </main>
    </>
  );
}
