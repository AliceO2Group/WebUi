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

import { UserRole, isUserRoleSufficient } from './../../../library/userRole.enum.js';
import { Observable } from '/js/src/index.js';

/**
 * Model namespace for LayoutCardModel
 */
export default class LayoutCardModel extends Observable {
  /**
   * Creates a new LayoutCardModel instance
   * @param {Model} model - The parent model utilizing this card
   * @param {object} layout - The layout data object containing:
   * @param {string} id - Unique identifier for the layout
   * @param {string} description - Description of the layout
   * @param {string} owner_name - Name of the layout owner
   * @param {boolean} isOfficial - Official status flag
   * @param {string} name - Display name of the layout
   */
  constructor(model, layout) {
    super();
    this.model = model;

    this.id = layout.id;
    this.description = layout.description;
    this.owner_name = layout.owner_name;
    this.isOfficial = layout.isOfficial;
    this.name = layout.name;

    this.notify();
  }

  /**
   * Toggles the official status of the layout and updates backend services
   * @async
   * @returns {Promise<void>}
   */
  async toggleOfficial() {
    this.isOfficial = !this.isOfficial;
    const layoutService = this.model.services.layout;

    await layoutService.patchLayout(this.id, { isOfficial: this.isOfficial });
    await layoutService.getLayouts(this);
    await layoutService.getLayoutsByUserId(this.model.session.personid, this);
    this.notify();
  };

  /**
   * Checks if current user has sufficient authority (GLOBAL role)
   * @async
   * @returns {boolean} True if user has sufficient authority
   */
  sufficientAuthority() {
    return this.model.session.access.some((role) => isUserRoleSufficient(role, UserRole.GLOBAL));
  }

  /**
   * Checks if this layout is equal to another layout based on ID
   * @param {LayoutCardModel} other - The other layout to compare with
   * @returns {boolean} True if layouts have the same ID
   */
  equals(other) {
    return other instanceof LayoutCardModel && this.id === other.id;
  }
}
