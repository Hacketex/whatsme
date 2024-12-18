//fservice-worker.js
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging.js');

const express = require('express');
const app = express();

// Middleware to allow CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Serve service worker file
app.use(express.static('public')); // Replace 'public' with your static folder

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});


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
