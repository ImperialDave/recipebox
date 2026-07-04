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
  window.localStorage.setItem(EMAIL_KEY, email);
}

export async function completeMagicLinkSignIn() {
  if (!isSignInWithEmailLink(auth, window.location.href)) {
    throw new Error("Invalid sign-in link");
  }

  let email = window.localStorage.getItem(EMAIL_KEY);
  if (!email) {
    email = window.prompt("Please enter your email to confirm sign-in");
  }
  if (!email) throw new Error("Email is required");

  const credential = await signInWithEmailLink(
    auth,
    email,
    window.location.href,
  );
  window.localStorage.removeItem(EMAIL_KEY);

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

export async function signOutClient() {
  await fetch("/api/auth/session", { method: "DELETE" });
  await auth.signOut();
}
