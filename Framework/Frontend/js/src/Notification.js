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
import { copyToClipboard } from './utilities/clipboard.js';
import { iconClipboard, iconCheck, iconCircleX } from './icons.js';

const DEFAULT_DURATION_MS = 5000;
const COPY_FEEDBACK_MS = 1500;

const NOTIFICATION_TYPES = ['danger', 'warning', 'success', 'primary'];

const NOTIFICATION_STATES = {
  SHOWN: 'shown',
  HIDDEN: 'hidden',
};

const COPY_STATES = {
  IDLE: 'idle',
  COPIED: 'copied',
  FAILED: 'failed',
};

const COPY_STATE_VIEW = {
  [COPY_STATES.IDLE]: { title: 'Copy to clipboard', icon: iconClipboard },
  [COPY_STATES.COPIED]: { title: 'Copied!', icon: iconCheck },
  [COPY_STATES.FAILED]: { title: "Couldn't copy", icon: iconCircleX },
};

/**
 * Container of notification with time management and copy-to-clipboard.
 * Only 1 notification is handled at once.
 * @extends Observable
 * @example
 * import { mount, h, Observable, Notification, notification } from '@aliceo2/web-ui';
 *
 * class Model extends Observable {
 *   constructor() {
 *     super();
 *     this.notification = new Notification();
 *     this.notification.bubbleTo(this);
 *   }
 * }
 *
 * // Render first inside body
 * const view = (model) => [
 *   notification(model.notification),
 *   h('div.m4', [
 *     h('button', { onclick: () => model.notification.show('Environment has been created.', 'success') }, 'Start Environment'),
 *   ]),
 * ];
 *
 * mount(document.body, view, new Model(), true);
 */
export class Notification extends Observable {
  /**
   * Initialize with empty notification
   */
  constructor() {
    super();

    this.message = '';
    this.type = 'primary';

    this.state = NOTIFICATION_STATES.HIDDEN;

    this.copyState = COPY_STATES.IDLE;
    this.copyError = null;

    this.hovered = false;
    this.duration = DEFAULT_DURATION_MS;

    this.hideTimerId = null;
    this.copyTimerId = null; // Timer to reset copyState to 'idle' after copy
  }

  /**
   * Whether a notification is currently displayed.
   * @return {boolean} - whether the notification is currently shown
   */
  get isShown() {
    return this.state === NOTIFICATION_STATES.SHOWN;
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

    if (!NOTIFICATION_TYPES.includes(type)) {
      throw new Error(`Notification type must be danger, warning, success or primary. "${type}" provided`);
    }

    this.clearTimeouts();

    this.message = message;
    this.type = type;
    this.duration = duration || DEFAULT_DURATION_MS;
    this.state = NOTIFICATION_STATES.SHOWN;
    this.copyState = COPY_STATES.IDLE;

    this.restartHideTimer();
    this.notify();
  }

  /**
   * Clear any active timeout for the currently shown notification.
   */
  clearTimeouts() {
    clearTimeout(this.hideTimerId);
    clearTimeout(this.copyTimerId);
  }

  /**
   * Set notification state to `'hidden'`, copy state to `'idle'` and clear `hovered` before countdown ends
   * (by a click on notification for example)
   */
  hide() {
    this.clearTimeouts();
    this.state = NOTIFICATION_STATES.HIDDEN;
    this.copyState = COPY_STATES.IDLE;
    this.hovered = false;

    this.notify();
  }

  /**
   * Track whether the notification is hovered. Leaving it restarts the auto-hide countdown.
   * @param {boolean} hovered - whether the pointer is over the notification
   */
  setHovered(hovered) {
    this.hovered = hovered;
    if (!hovered) {
      this.restartHideTimer();
    }
  }

  /**
   * (Re)start the auto-hide countdown using the stored duration. The notification is only hidden
   * when the countdown ends AND it is not hovered.
   * No-op when the notification is hidden or duration is Infinity.
   */
  restartHideTimer() {
    clearTimeout(this.hideTimerId);
    if (!this.isShown || this.duration === Infinity) {
      return;
    }
    this.hideTimerId = setTimeout(() => !this.hovered && this.hide(), this.duration);
  }

  /**
   * Copy the current message to the clipboard and flash `copyState` to `'copied'` for `COPY_FEEDBACK_MS` ms.
   * If the clipboard is unavailable or the write rejects, `copyState` flashes to `'failed'` instead.
   * @return {Promise<void>}
   */
  async copy() {
    if (!this.isShown) {
      return;
    }
    const copiedMessage = this.message;
    let nextState;
    let copyError = null;
    try {
      await copyToClipboard(copiedMessage);
      nextState = COPY_STATES.COPIED;
    } catch (err) {
      nextState = COPY_STATES.FAILED;
      copyError = err.message;
    }

    // The notification was hidden or replaced while the write was pending
    if (!this.isShown || this.message !== copiedMessage) {
      return;
    }

    clearTimeout(this.copyTimerId);
    this.copyState = nextState;
    this.copyError = copyError;
    this.notify();

    this.copyTimerId = setTimeout(() => {
      this.copyState = COPY_STATES.IDLE;
      this.copyError = null;
      this.notify();
    }, COPY_FEEDBACK_MS);
  }
}

/**
 * Shows notification according to a notification instance. Because of its absolute position it should
 * be placed as first element inside body.
 * @param {Notification} instance - instance of Notification
 * @return {vnode} - virtual node to render notification
 */
export const notification = (instance) => {
  const { type, message, copyState, isShown } = instance;
  const { title, icon } = COPY_STATE_VIEW[copyState];

  return h('.notification.text-no-select.level4.text-light', h('div.notification-content.br2.shadow-level4', {
    className: `white bg-${type} ${isShown ? 'notification-open' : 'notification-close'}`,
    onmouseenter: () => instance.setHovered(true),
    onmouseleave: () => instance.setHovered(false),
  }, [
    h(
      'div.notification-message.ph2.pv2',
      {
        title: 'Click to dismiss',
        onclick: () => instance.hide(),
      },
      message,
    ),
    h('button.btn.notification-copy-btn', {
      tabIndex: isShown ? 0 : -1,
      title: instance.copyError ?? title,
      onclick: () => instance.copy(),
    }, icon()),
  ]));
};
