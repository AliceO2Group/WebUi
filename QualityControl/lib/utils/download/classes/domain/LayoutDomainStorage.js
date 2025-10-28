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
import { LayoutDomain } from './LayoutDomain.js';

/** @import { TabDomain } from './TabDomain.js'; */

/**
 * @augments LayoutDomain
 */
export class LayoutDomainStorage extends LayoutDomain {
  /**
   * constructor
   * @param {string} id - id
   * @param {string} name - name
   * @param {TabDomain[]} tabs - tabs
   * @param {number} downloadUserId - userid of the user who requested this download.
   */
  constructor(id, name, tabs, downloadUserId) {
    if (
      downloadUserId != 0
    ) {
      super(id, name, tabs);
      this.downloadUserId = downloadUserId;
    } else {
      throw new Error('Failed to instanciate LayoutDomainStorage');
    }
  }

  downloadUserId;

  /**
   * return a representation of the parent.
   * @returns {LayoutDomain} return
   */
  toSuper() {
    return new LayoutDomain(this.id, this.name, this.tabs);
  }
}
