const webPush = require('web-push');
require('dotenv').config();

const publicVapidKey = 'BGgKCQ9Od_ZuexQND6TSsZqa9O52uo82aAh08-YXXbbtC_jzUlKgKcRBMqmBez_xg43tAIo1fL1mI4yRAgXmKrs';
const privateVapidKey = 'Xn8Z85i4UXAFiDltS1TUY4iqHJFZmtxcNfR-gt1ORFA';

webPush.setVapidDetails(
    'mailto:your-email@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const pushSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/dRo8FWUKOtM:APA91bELDq0reejhM7lq4XU5OsOqflV3tTjbyq13EVl7V2OEOWX8_n0G4bpgQIqh4XRAPZ-bOJhRbd3KZ3heS4okNDhcSGiD_o1FwHrYe9DZv3VFqITF4xsYstA8xy0qysX7z9YfmsxX',
    keys: {
        auth: 'MBcaNaioQCqldkPxRS_OOA',
        p256dh: 'BLoitfD_n-1E5PinIX_OB86KNdpWbCyHHelvAghit_Hlnh-c6p1uQWqHYTR2ZLRxiQoPH-SdL9xGVhb_Bl-ieTQ'
    }
};

const payload = JSON.stringify({ title: 'Hello!', body: 'This is a test notification.' });

webPush.sendNotification(pushSubscription, payload)
    .then(response => console.log('Notification sent successfully:', response))
    .catch(error => console.error('Error sending notification:', error));
