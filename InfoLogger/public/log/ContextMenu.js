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

import { Observable } from '/js/src/index.js';

/**
 * Model for the log table cell context menu state.
 */
export default class ContextMenu extends Observable {
  constructor() {
    super();

    this.isOpen = false;
    this.field = null;
    this.value = null;
    this.x = 0;
    this.y = 0;
  }

  /**
   * Open the context menu at the given position for a specific field/value.
   * @param {string} field - the log field (e.g. 'hostname', 'severity', 'timestamp')
   * @param {string} value - the cell value
   * @param {number} x - mouse x position
   * @param {number} y - mouse y position
   */
  show(field, value, x, y) {
    this.isOpen = true;
    this.field = field;
    this.value = value;
    this.x = x;
    this.y = y;
    this.notify();
  }

  /**
   * Close the context menu.
   */
  hide() {
    this.isOpen = false;
    this.notify();
  }
}
