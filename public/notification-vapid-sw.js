/* eslint-env browser, serviceworker, es6 */

'use strict';

// Receiving push and showing notification
self.addEventListener('push', function(event) {
  // console.log('[Service Worker] Push Received.');
  // console.log(`[Service Worker] Push had this data: "${event.data.json()}"`);

  const title = `${event.data.json().title}`;
  const options = {
    body: `${event.data.json().message}`,
    icon: './../img/icon.png',
    badge: './../img/badge.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Closing the notification on click
self.addEventListener('notificationclick', function(event) {
  // console.log('[Service Worker] Notification click Received.');

  event.notification.close();
});
