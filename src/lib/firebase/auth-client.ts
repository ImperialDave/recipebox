"use client";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updateProfile,
} from "firebase/auth";
import { auth } from "./client";

const EMAIL_KEY = "frb_email_for_sign_in";

export async function createSessionCookie(idToken: string) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to create session");
  }
}

export async function signInWithPasswordClient(
  email: string,
  password: string,
) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();
  await createSessionCookie(idToken);
  return credential.user;
}

export async function signUpClient(
  email: string,
  password: string,
  fullName: string,
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await updateProfile(credential.user, { displayName: fullName });

  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken: await credential.user.getIdToken(),
      fullName,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to register profile");
  }

  await createSessionCookie(await credential.user.getIdToken());
  return credential.user;
}

export async function sendMagicLinkClient(email: string) {
  const actionCodeSettings = {
    url: `${window.location.origin}/auth/callback`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  try {
    window.localStorage.setItem(EMAIL_KEY, email);
  } catch {
    // Safari private mode still allows magic link with manual email confirm
  }
}

export function isMagicLinkCallback(): boolean {
  return isSignInWithEmailLink(auth, window.location.href);
}

export function getStoredMagicLinkEmail(): string | null {
  try {
    return window.localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export async function completeMagicLinkSignInWithEmail(email: string) {
  if (!isSignInWithEmailLink(auth, window.location.href)) {
    throw new Error("Invalid sign-in link");
  }

  const normalizedEmail = email.trim();
  if (!normalizedEmail) throw new Error("Email is required");

  const credential = await signInWithEmailLink(
    auth,
    normalizedEmail,
    window.location.href,
  );

  try {
    window.localStorage.removeItem(EMAIL_KEY);
  } catch {
    // Safari private mode or cross-tab handoff from Mail
  }

  await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken: await credential.user.getIdToken(),
      fullName: credential.user.displayName || "",
    }),
  });

  await createSessionCookie(await credential.user.getIdToken());
  return credential.user;
}

export async function completeMagicLinkSignIn() {
  const storedEmail = getStoredMagicLinkEmail();
  if (!storedEmail) {
    throw new Error("EMAIL_REQUIRED");
  }
  return completeMagicLinkSignInWithEmail(storedEmail);
}

export async function signOutClient() {
  await fetch("/api/auth/session", { method: "DELETE" });
  await auth.signOut();
}
