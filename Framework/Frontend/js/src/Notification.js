import Observable from './Observable.js';
import {h} from './renderer.js';
import switchCase from './switchCase.js';

/**
 * Container of notification with time management
 * Only 1 notification is handled at once.
 * @extends Observable
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
   * Set notification as opened with content and type
   * @param {string} message - what to say
   * @param {string} type - how to say (danger, warning, success, primary)
   * @param {number} duration - optional, how much time to show it (ms), can be Infinity
   */
  show(message, type, duration) {
    if (!message) {
      return;
    }

    if (type !== 'danger' && type !== 'warning' &&
        type !== 'success' && type !== 'primary') {
      throw new Error(`Notification type must be danger, warning, success or primary. "${type}" provided`);
    }

    // clear previous message countdown
    clearTimeout(this.timerId);

    this.message = message;
    this.type = type;
    this.state = 'shown';
    this.timerId = setTimeout(() => {
      this.hide();
    }, duration || 5000);

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
export const notification = (notificationInstance) => h('.notification.text-no-select', {

}, h('span.notification-content.br2.p2.shadow-level3', {
  // className: notificationInstance.message && (notificationInstance.state === 'shown' ? 'notification-open' : 'notification-close'),
  onclick: () => notificationInstance.hide(),
  className: switchCase(notificationInstance.type, {
    primary: 'white bg-primary',
    success: 'white bg-success',
    warning: 'white bg-warning',
    danger: 'white bg-danger',
  }) + ' ' + (notificationInstance.state === 'shown' ? 'notification-open' : 'notification-close')
}, notificationInstance.message));
