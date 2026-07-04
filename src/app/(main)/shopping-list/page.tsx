import { ShoppingListClient } from "./shopping-list-client";
import { getCurrentUser, getShoppingList } from "@/lib/queries";
import { redirect } from "next/navigation";

export default async function ShoppingListPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = await getShoppingList();

  return <ShoppingListClient initialItems={items} />;
}
