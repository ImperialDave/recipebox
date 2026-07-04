import { getAdminDb } from "@/lib/firebase/admin";

const DEFAULT_DAILY_LIMIT = 20;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDailyLimit(): number {
  const configured = Number(process.env.RECIPE_SCAN_DAILY_LIMIT);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_DAILY_LIMIT;
}

export async function checkRecipeScanRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetsAt: string;
}> {
  const db = getAdminDb();
  const doc = await db.collection("users").doc(userId).get();
  const usage = doc.data()?.recipe_scan_usage as
    | { date?: string; count?: number }
    | undefined;

  const limit = getDailyLimit();
  const date = todayKey();
  const count =
    usage?.date === date && typeof usage.count === "number" ? usage.count : 0;
  const remaining = Math.max(0, limit - count);

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  return {
    allowed: count < limit,
    remaining,
    limit,
    resetsAt: tomorrow.toISOString(),
  };
}

export async function recordRecipeScan(userId: string): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection("users").doc(userId);
  const doc = await ref.get();
  const usage = doc.data()?.recipe_scan_usage as
    | { date?: string; count?: number }
    | undefined;

  const date = todayKey();
  const count =
    usage?.date === date && typeof usage.count === "number" ? usage.count : 0;

  await ref.set(
    {
      recipe_scan_usage: {
        date,
        count: count + 1,
      },
    },
    { merge: true },
  );
}