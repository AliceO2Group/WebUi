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

/**
 * Container to be used for sharing services across the project
 */
export class DI {
  /**
   * Constructor to define expected services
   */
  constructor() {
    this._notification = null;
  }

  /**
   * Return the instance of the notification service
   * @returns {O2Notification}
   */
  get notification() {
    return this._notification;
  }

  /**
   * Set the notification service
   * @param {O2Notification}
   */
  set notification(notificationService) {
    this._notification = notificationService;
  }
}

export const di = new DI();
