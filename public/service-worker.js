//service-worker.js
self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icon.png',
            badge: '/badge.png',
            data: {
                url: data.url
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    } else {
        console.error('Push event but no data');
    }
});

// Handle notification click event
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (let client of windowClients) {
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
