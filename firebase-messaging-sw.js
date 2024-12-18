//firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging.js");

const firebaseConfig = {
    apiKey: "AIzaSyAz2NDwjpuge1imPoIRLdHjYKXpIUqPY8o",
    authDomain: "fbchatapp-7f397.firebaseapp.com",
    projectId: "fbchatapp-7f397",
    storageBucket: "fbchatapp-7f397.firebasestorage.app",
    messagingSenderId: "1043056589173",
    appId: "1:1043056589173:web:4329be1bffdfa8df637b3c",
    measurementId: "G-2LZXSL163S"
  };

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

  messaging. onBackgroundMessage ((payload) => {
    console.log("[firebase-messaging-sw.js] Received background message:", payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions ={
        body: payload.notification.body,
        icon: payload.notification. image,
        // icon: "/firebase-logo.png",
        image: "/firebase-logo.png",
        badge: "/firebase-logo.png",
        data: payload.data,
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});
