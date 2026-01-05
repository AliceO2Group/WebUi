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

import { Observable, BrowserStorage, showNativeBrowserNotification } from '/js/src/index.js';
import { EmitterKeys } from '../../../../library/enums/emitterKeys.enum.js';
import { StorageKeysEnum } from '../../enums/storageKeys.enum.js';
import { Transition } from '../../../../library/enums/transition.enum.js';

/**
 * Model responsible for handling browser notifications when a new run starts.
 */
export default class NotificationRunStartModel extends Observable {
  /**
   * Initialize with empty values
   * @param {Model} model - root model of the application
   */
  constructor(model) {
    super();

    this.model = model;
    this._browserNotificationStorage = new BrowserStorage(StorageKeysEnum.NOTIFICATION_START_RUN_SETTING);

    this.model.ws.addListener('command', (message) => {
      if (message.command === EmitterKeys.RUN_TRACK) {
        this._handleWSRunTrack.bind(this, message.payload);
      }
    });
  }

  /**
   * Returns whether browser notifications for run start events
   * are enabled for the current user.
   * @returns {boolean} `true` if notifications are enabled, `false` otherwise.
   */
  getBrowserNotificationSetting() {
    try {
      return this._browserNotificationStorage.getLocalItem(this.model.session.personid.toString()) ?? false;
    } catch {
      this._browserNotificationStorage.removeLocalItem(this.model.session.personid.toString());
      return false;
    }
  }

  /**
   * Persists the browser notification preference for the current user
   * and notifies all observers.
   * @param {boolean} enabled - Whether notifications should be enabled.
   * @returns {undefined}
   */
  setBrowserNotificationSetting(enabled) {
    this._browserNotificationStorage.setLocalItem(this.model.session.personid.toString(), enabled);
    this.notify();
  }

  /**
   * Handles {@link EmitterKeys.RUN_TRACK} WebSocket events.
   * A native browser notification is displayed only when:
   * - The transition is {@link Transition.START_ACTIVITY}
   * - The user has enabled notifications
   * @param {object} payload - WebSocket payload.
   * @param {number} payload.runNumber - Run number that started.
   * @param {Transition} payload.transition - Transition type.
   * @returns {undefined}
   */
  async _handleWSRunTrack({ runNumber, transition }) {
    if (transition !== Transition.START_ACTIVITY) {
      return;
    }

    if (!this.getBrowserNotificationSetting()) {
      return;
    }

    showNativeBrowserNotification({
      title: `RUN ${runNumber ?? 'unknown'} has started`,
      onclick: () => {
        const { isRunModeActivated } = this.model.filterModel;
        if (!isRunModeActivated) {
          const viewModel = this.model.filterModel.getPageTargetModel();
          if (viewModel) {
            this.model.filterModel.activateRunsMode(viewModel);
          }
        }

        this.model.filterModel.setFilterValue('RunNumber', runNumber?.toString(), true);
      },
    });
  }
}
