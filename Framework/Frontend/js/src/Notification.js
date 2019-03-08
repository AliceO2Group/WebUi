/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

import Observable from './Observable.js';
import {h} from './renderer.js';
import switchCase from './switchCase.js';

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
    this.state = 'hidden'; // shown, hidden
    this.timerId = 0; // timer to auto-hide notification
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

    // clear previous message countdown
    clearTimeout(this.timerId);

    this.message = message;
    this.type = type;
    this.state = 'shown';

    // auto-hide after duration
    if (duration !== Infinity) {
      this.timerId = setTimeout(() => {
        this.hide();
      }, duration);
    }

    this.notify();
  }

  /**
   * Set notification as hidden before countdown ends
   * (by a click on notification for example)
   */
  hide() {
    clearTimeout(this.timerId);
    this.state = 'hidden';

    this.notify();
  }
}

/**
 * Shows notification according to `notificationInstance`. Because of its absolute position it should
 * be placed as first element inside body.
 * @param {Notification} notificationInstance
 * @return {vnode}
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

}, h('span.notification-content.br2.p2.shadow-level4', {
  // className: notificationInstance.message && (notificationInstance.state === 'shown' ? 'notification-open' : 'notification-close'),
  onclick: () => notificationInstance.hide(),
  className: switchCase(notificationInstance.type, {
    primary: 'white bg-primary',
    success: 'white bg-success',
    warning: 'white bg-warning',
    danger: 'white bg-danger',
  }) + ' ' + (notificationInstance.state === 'shown' ? 'notification-open' : 'notification-close')
}, notificationInstance.message));
