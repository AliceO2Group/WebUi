/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

/* Global: window */

import { isContextSecure } from './browserContext.js';

/**
 * Browser notification permission values.
 * Mirrors the Notification API specification.
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Notification/permission_static
 */
export const BrowserNotificationPermission = Object.freeze({
  GRANTED: 'granted',
  DEFAULT: 'default',
  DENIED: 'denied',
});

/**
 * Get the current browser notification permission.
 * @returns {BrowserNotificationPermission|undefined} One of {@link BrowserNotificationPermission}, or `undefined` if unsupported.
 */
export const getBrowserNotificationPermission = () =>
  window?.Notification?.permission;

/**
 * Request browser notification permission (async/await).
 * @returns {Promise<BrowserNotificationPermission|undefined>} One of {@link BrowserNotificationPermission}, or `undefined` if unsupported
 */
export const requestBrowserNotificationPermissions = async () => {
  if (!isContextSecure()) {
    return undefined;
  }

  const permission = getBrowserNotificationPermission();
  if (permission === BrowserNotificationPermission.GRANTED) {
    return permission;
  }

  return await window.Notification?.requestPermission();
};

/**
 * Check if notifications can be shown immediately.
 * @returns {boolean} `true` if the Notification API is available, the context is secure
 * and the current {@link BrowserNotificationPermission} is {@link BrowserNotificationPermission.GRANTED}, `false` otherwise.
 */
export const checkBrowserNotificationPermissions = () =>
  isContextSecure() && getBrowserNotificationPermission() === BrowserNotificationPermission.GRANTED;

/**
 * @typedef {object} NotificationOptions
 * @property {string} title Notification title
 * @property {string} [body] Notification body
 * @property {string} [icon] Notification icon URL (defaults to server icon)
 * @property {(event: Event) => void} [onclick] Triggered when the notification is clicked
 * @property {(event: Event) => void} [onerror] Triggered if the notification fails to display
 * @property {(event: Event) => void} [onshow] Triggered when the notification is shown
 * @property {(event: Event) => void} [onclose] Triggered when the notification is closed
 */

/**
 * Show a native browser notification.
 * @param {NotificationOptions} options - The browser notification options
 * @returns {Notification|null} {@link Notification} instance, or `null` if unavailable
 */
export const showNativeBrowserNotification = (options) => {
  if (!checkBrowserNotificationPermissions()) {
    return null;
  }

  const {
    title,
    onclick,
    onerror,
    onshow,
    onclose,
    icon = '/favicon.ico',
    ...notificationOptions
  } = options;
  if (!title) {
    return null;
  }

  const notification = new window.Notification(title, { icon, ...notificationOptions });
  Object.entries({ onclick, onerror, onshow, onclose })
    .filter(([_, eventFunc]) => typeof eventFunc === 'function')
    .forEach(([eventName, eventFunc]) => {
      notification[eventName] = eventFunc;
    });

  return notification;
};
