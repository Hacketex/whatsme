// // Enhanced service-worker.js

// // Listener for push events
// self.addEventListener('push', function(event) {
//     if (event.data) {
//         const data = event.data.json();

//         const options = {
//             body: data.body,
//             icon: data.icon || '/default-icon.png', // Use a default icon if not provided
//             badge: data.badge || '/default-badge.png', // Use a default badge if not provided
//             actions: [
//                 { action: 'view', title: 'View' },
//                 { action: 'dismiss', title: 'Dismiss' }
//             ],
//             data: {
//                 url: data.url || '/' // Default to root URL if no URL provided
//             }
//         };

//         event.waitUntil(
//             self.registration.showNotification(data.title || 'Notification', options)
//         );
//     } else {
//         console.error('Push event received, but no data.');
//     }
// });

// // Listener for notification click events
// self.addEventListener('notificationclick', function(event) {
//     const notificationData = event.notification.data;
//     event.notification.close();

//     event.waitUntil(
//         clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
//             for (let client of windowClients) {
//                 if (client.url === notificationData.url && 'focus' in client) {
//                     return client.focus();
//                 }
//             }
//             if (clients.openWindow) {
//                 return clients.openWindow(notificationData.url);
//             }
//         })
//     );
// });

// // Listener for notification close events
// self.addEventListener('notificationclose', function(event) {
//     console.log('Notification closed:', event.notification);
//     // You can add analytics or cleanup logic here if needed
// });

// // Activate event to clean up old caches or perform updates
// self.addEventListener('activate', function(event) {
//     event.waitUntil(
//         clients.claim().then(() => {
//             console.log('Service worker activated and took control of clients.');
//         })
//     );
// });

// // Install event to pre-cache static assets (optional)
// self.addEventListener('install', function(event) {
//     console.log('Service worker installed.');
//     // Use caching logic here if needed
// });

//firebase setup
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging.js');

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

messaging.onBackgroundMessage((payload) => {
    console.log('Received background message: ', payload);
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/icon.png'
    });
});
