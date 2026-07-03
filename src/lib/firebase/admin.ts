import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let adminAvailable = true;

function getAdminApp(): App | null {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccount || serviceAccount.includes("placeholder")) {
    adminAvailable = false;
    return null;
  }

  try {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch {
    adminAvailable = false;
    return null;
  }
}

export function isAdminAvailable() {
  return adminAvailable && !!getAdminApp();
}

function requireAdminApp(): App {
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin is not configured");
  return app;
}

export function getAdminAuth() {
  return getAuth(requireAdminApp());
}

export function getAdminDb() {
  return getFirestore(requireAdminApp());
}

export function getAdminStorage() {
  return getStorage(requireAdminApp());
}