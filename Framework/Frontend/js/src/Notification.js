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

import Observable from './Observable.js';
import { h } from './renderer.js';
import switchCase from './switchCase.js';
import { iconClipboard, iconCheck, iconCircleX } from './icons.js';

/**
 * Container of notification with time management
 * Only 1 notification is handled at once.
 * @extends Observable
 * @example
 * import {mount, h, Notification, notification} from '../../Frontend/js/src/index.js';
 *
 * const view = (model) => [
 *   notification(model),
 *   h('div.m4', [
 *     h('button', {onclick: () => model.show('An admin has taken lock form you.', 'primary')}, 'Show primary'),
 *     h('button', {onclick: () => model.show('Environment has been created.', 'success')}, 'Show success'),
 *     h('button', {onclick: () => model.show('Unable to create, please check inputs and retry.', 'warning')}, 'Show warning'),
 *     h('button', {onclick: () => model.show('Server connection has been lost.', 'danger')}, 'Show danger'),
 *   ]),
 * ];
 *
 * // Create some basic model
 * const model = new Notification();
 *
 * mount(document.body, view, model, true);
 */
export class Notification extends Observable {
  /**
   * Initialize with empty notification
   */
  constructor() {
    super();

    this.message = '';
    this.type = 'primary';
    this.state = 'hidden'; // Shown, hidden
    this.hideTimerId = null; // Timer to auto-hide notification
    this.duration = 5000; // Original duration of the current notification
    this.hovered = false; // Whether the notification is hovered
    this.copyState = 'idle'; // 'idle' | 'copied' | 'failed' — state for the copy button
    this.copyTimerId = null; // Timer to reset copyState to 'idle' after copy
  }

  /**
   * Set notification as opened with content and type.
   * `duration` for `danger` type should be set to Infinity if error is fatal for application (not working until reload)
   * @param {string} message - what to say
   * @param {string} type - how to say (danger, warning, success, primary)
   * @param {number} duration - optional, how much time to show it (ms), Infinity for unlimited time.
   */
  show(message, type, duration) {
    if (!message) {
      return;
    }

    if (type !== 'danger' && type !== 'warning' &&
        type !== 'success' && type !== 'primary') {
      throw new Error(`Notification type must be danger, warning, success or primary. "${type}" provided`);
    }

    duration = duration || 5000;

    // Clear previous message countdowns
    clearTimeout(this.hideTimerId);
    clearTimeout(this.copyTimerId);

    this.message = message;
    this.type = type;
    this.state = 'shown';
    this.duration = duration;
    this.copyState = 'idle';

    // Auto-hide after duration
    if (duration !== Infinity) {
      this.hideTimerId = setTimeout(() => {
        if (!this.hovered) {
          this.hide();
        }
      }, duration);
    }

    this.notify();
  }

  /**
   * Set notification as hidden before countdown ends
   * (by a click on notification for example)
   */
  hide() {
    clearTimeout(this.hideTimerId);
    clearTimeout(this.copyTimerId);
    this.state = 'hidden';
    this.copyState = 'idle';

    this.notify();
  }

  /**
   * Restart the auto-hide countdown for the currently shown notification, reusing the
   * stored duration.
   * No-op when the notification is hidden or duration is Infinity.
   */
  restartHideTimer() {
    if (this.state !== 'shown') {
      return;
    }
    clearTimeout(this.hideTimerId);
    if (this.duration !== Infinity) {
      this.hideTimerId = setTimeout(() => {
        if (!this.hovered) {
          this.hide();
        }
      }, this.duration);
    }
  }

  /**
   * Copy the current message to the clipboard and flash `copyState` to `'copied'` for 1.5s.
   * If the clipboard write rejects, `copyState` flashes to `'failed'` instead.
   * @return {Promise<void>}
   */
  async copy() {
    let nextState;
    try {
      await navigator.clipboard.writeText(this.message);
      nextState = 'copied';
    } catch {
      nextState = 'failed';
    }
    clearTimeout(this.copyTimerId);
    this.copyState = nextState;
    this.notify();
    this.copyTimerId = setTimeout(() => {
      this.copyState = 'idle';
      this.notify();
    }, 1500);
  }
}

/**
 * Shows notification according to `notificationInstance`. Because of its absolute position it should
 * be placed as first element inside body.
 * @param {Notification} notificationInstance - instance of Notification
 * @return {vnode} - virtual node to render notification
 * @example
 * import {mount, h, Notification, notification} from '../../Frontend/js/src/index.js';
 *
 * const view = (model) => [
 *   notification(model),
 *   h('div.m4', [
 *     h('button', {onclick: () => model.show('An admin has taken lock form you.', 'primary')}, 'Show primary'),
 *     h('button', {onclick: () => model.show('Environment has been created.', 'success')}, 'Show success'),
 *     h('button', {onclick: () => model.show('Unable to create, please check inputs and retry.', 'warning')}, 'Show warning'),
 *     h('button', {onclick: () => model.show('Server connection has been lost.', 'danger')}, 'Show danger'),
 *   ]),
 * ];
 *
 * // Create some basic model
 * const model = new Notification();
 *
 * mount(document.body, view, model, true);
 */
export const notification = (notificationInstance) => h('.notification.text-no-select.level4.text-light', {

}, h('div.notification-content.br2.shadow-level4', {
  // ClassName: notificationInstance.message && (notificationInstance.state === 'shown' ? 'notification-open' : 'notification-close'),
  onmouseenter: () => {
    notificationInstance.hovered = true;
  },
  onmouseleave: () => {
    notificationInstance.hovered = false;
    notificationInstance.restartHideTimer();
  },
  className: `${switchCase(notificationInstance.type, {
    primary: 'white bg-primary',
    success: 'white bg-success',
    warning: 'white bg-warning',
    danger: 'white bg-danger',
  })} ${notificationInstance.state === 'shown' ? 'notification-open' : 'notification-close'}`,
}, [
  h('div.mh2.pv2', { onclick: () => notificationInstance.hide() }, notificationInstance.message),
  h(`button.btn.btn-${notificationInstance.type}.notification-copy-btn`, {
    title: switchCase(notificationInstance.copyState, {
      copied: 'Copied!',
      failed: "Couldn't copy",
      idle: 'Copy to clipboard',
    }),
    onclick: (e) => {
      e.stopPropagation();
      notificationInstance.copy();
    },
  }, switchCase(notificationInstance.copyState, {
    copied: iconCheck(),
    failed: iconCircleX(),
    idle: iconClipboard(),
  })),
]));
