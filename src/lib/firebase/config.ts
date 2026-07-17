/** Public Firebase web config (same project as mobile: bisa-51853). */
export const firebaseWebConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyB0l4mj7OzIdq-p8bh9gss2_gQxBrVM4lc",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "bisa-51853.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "bisa-51853",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "bisa-51853.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "94564351976",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:94564351976:web:3753185670ffe399442e5d",
};

export const firebaseVapidKey =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";
