function enableNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('Service Worker registered:', registration);
                // Request Notification permission
                return Notification.requestPermission();
            })
            .then(function(permission) {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                    // Subscribe the user to push notifications
                    subscribeUserToPush();
                } else {
                    console.warn('Notification permission not granted.');
                }
            })
            .catch(function(error) {
                console.error('Service Worker registration failed:', error);
            });
    } else {
        console.warn('Push messaging is not supported');
    }
}

function subscribeUserToPush() {
    navigator.serviceWorker.ready.then(function(registration) {
        const publicVapidKey = 'BConakqRZwz8Ht-s4khpOTvwMr72vjJDIJ0cNceCOdyJC5iZN9ty7a4EWOI_126-o64tkm6Uop_KgapCJJ5eO5c';
        const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

        registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
        }).then(function(subscription) {
            console.log('Received PushSubscription:', subscription);
            // Send subscription to server
            fetch('/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: subscription,
                    userId: 9
                })
            });
        }).catch(function(error) {
            console.error('Failed to subscribe user:', error);
        });
    });
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
