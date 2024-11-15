// push-notifications.js
document.getElementById('enable-notifications').addEventListener('click', () => {
    // Only call permission request once on button click (user gesture)
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            enableNotifications(); // Call enableNotifications only if permission is granted
        } else {
            console.warn('Notification permission not granted.');
        }
    });
});

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            enableNotifications();
        }
    });
}



function enableNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration);
                subscribeUserToPush(); // No need to call Notification.requestPermission again
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    } else {
        console.warn('Push messaging is not supported');
    }
}

function subscribeUserToPush() {
    navigator.serviceWorker.ready.then((registration) => {
        const publicVapidKey = 'BGgKCQ9Od_ZuexQND6TSsZqa9O52uo82aAh08-YXXbbtC_jzUlKgKcRBMqmBez_xg43tAIo1fL1mI4yRAgXmKrs';
        const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

        // Clear any existing subscription
        registration.pushManager.getSubscription().then(subscription => {
            if (subscription) {
                return subscription.unsubscribe().then(() => {
                    console.log('Unsubscribed existing subscription.');
                    return registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedVapidKey
                    });
                });
            } else {
                return registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });
            }
        }).then(subscription => {
            console.log('New subscription:', subscription);
            const keys = subscription.keys;
            if (keys && keys.auth && keys.p256dh) {
                console.log('auth key:', keys.auth);
                console.log('p256dh key:', keys.p256dh);
            } else {
                console.error('Error: Missing keys in subscription');
            }
        }).catch(error => {
            console.error('Failed to subscribe user:', error);
        });
    });
}

// Helper function to convert base64 public VAPID key to Uint8Array
// function urlBase64ToUint8Array(base64String) {
//     const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
//     const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
//     const rawData = window.atob(base64);
//     const outputArray = new Uint8Array(rawData.length);

//     for (let i = 0; i < rawData.length; ++i) {
//         outputArray[i] = rawData.charCodeAt(i);
//     }
//     return outputArray;
// }
