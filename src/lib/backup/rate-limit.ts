import { getAdminDb } from "@/lib/firebase/admin";

const BACKUP_COOLDOWN_MS = 5 * 60 * 1000;

export async function checkBackupRateLimit(
  userId: string,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const db = getAdminDb();
  const doc = await db.collection("users").doc(userId).get();
  const lastBackup = doc.data()?.last_backup_at;

  if (!lastBackup) return { allowed: true };

  const lastMs =
    lastBackup.toDate?.()?.getTime() ?? new Date(lastBackup).getTime();
  const elapsed = Date.now() - lastMs;

  if (elapsed >= BACKUP_COOLDOWN_MS) return { allowed: true };

  return {
    allowed: false,
    retryAfterSeconds: Math.ceil((BACKUP_COOLDOWN_MS - elapsed) / 1000),
  };
}

export async function recordBackup(userId: string): Promise<void> {
  const db = getAdminDb();
  await db
    .collection("users")
    .doc(userId)
    .set({ last_backup_at: new Date() }, { merge: true });
}
