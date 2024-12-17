// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAz2NDwjpuge1imPoIRLdHjYKXpIUqPY8o",
  authDomain: "fbchatapp-7f397.firebaseapp.com",
  projectId: "fbchatapp-7f397",
  storageBucket: "fbchatapp-7f397.firebasestorage.app",
  messagingSenderId: "1043056589173",
  appId: "1:1043056589173:web:4329be1bffdfa8df637b3c",
  measurementId: "G-2LZXSL163S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const messaging = getMessaging(app);
