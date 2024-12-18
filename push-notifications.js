//push-notificatons.js
import { getMessaging, getToken } from "firebase/messaging";

const messaging = getMessaging();
const vapidKey = "BNPE2GLeiy4s95wOF3fHsiRDz0HjWd_wRf20U3yj7WsqrKKHkz0s-KGV3DUcq_kAqoilf_nRNJzldAANJTsVBBI";
getToken(messaging, {vapidKey: "BNPE2GLeiy4s95wOF3fHsiRDz0HjWd_wRf20U3yj7WsqrKKHkz0s-KGV3DUcq_kAqoilf_nRNJzldAANJTsVBBI"});

export const requestPermission = async () => {
    try {
        const status = await Notification.requestPermission();
        if (status === 'granted') {
            console.log('Notification permission granted.');
            const token = await getToken(messaging, { vapidKey });
            console.log('FCM Token:', token);
            return token; // Send this token to the backend
        } else {
            console.error('Notification permission not granted.');
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
};

onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    // Display notification in UI
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon,
    };
    new Notification(payload.notification.title, notificationOptions);
});

navigator.serviceWorker
  .register('/firebase-messaging-sw.js')
  .then((registration) => {
    console.log('Service Worker registered:', registration);
  })
  .catch((error) => {
    console.error('Service Worker registration failed:', error);
  });

  