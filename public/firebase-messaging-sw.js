/* eslint-disable no-undef */
// Firebase Cloud Messaging service worker (background push for admin web).
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyB0l4mj7OzIdq-p8bh9gss2_gQxBrVM4lc",
  authDomain: "bisa-51853.firebaseapp.com",
  projectId: "bisa-51853",
  storageBucket: "bisa-51853.firebasestorage.app",
  messagingSenderId: "94564351976",
  appId: "1:94564351976:web:3753185670ffe399442e5d",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "BISA Admin";
  const options = {
    body: payload.notification?.body ?? "",
    icon: "/images/logo/logo-icon.svg",
    data: payload.data ?? {},
  };
  self.registration.showNotification(title, options);
});
