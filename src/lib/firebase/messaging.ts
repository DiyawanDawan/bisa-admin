"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from "firebase/messaging";
import { firebaseVapidKey, firebaseWebConfig, isFirebaseConfigured } from "@/lib/firebase/config";
import { registerFcmToken } from "@/lib/api/admin";

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let foregroundListenerAttached = false;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseWebConfig);
  }
  return app;
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;
  if (!messaging) {
    messaging = getMessaging(getFirebaseApp());
  }
  return messaging;
}

function attachForegroundListener(instance: Messaging) {
  if (foregroundListenerAttached) return;
  foregroundListenerAttached = true;
  onMessage(instance, (payload) => {
    const title = payload.notification?.title ?? "BISA Admin";
    const body = payload.notification?.body ?? "";
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/images/logo/logo-icon.svg" });
    }
  });
}

/**
 * Request browser notification permission, obtain FCM token, register with backend.
 */
export async function registerAdminFcmDevice(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isFirebaseConfigured()) {
    console.warn(
      "[FCM] NEXT_PUBLIC_FIREBASE_* / VAPID_KEY belum diset — skip register token admin.",
    );
    return;
  }

  const instance = await getMessagingInstance();
  if (!instance) return;

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
  } else if (Notification.permission !== "granted") {
    return;
  }

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
    { scope: "/" },
  );

  const token = await getToken(instance, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) return;

  await registerFcmToken(token);
  attachForegroundListener(instance);
}
