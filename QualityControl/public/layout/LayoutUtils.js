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

import { objectId, clone } from '../common/utils.js';

/**
 * Class with utility functions for Layouts
 */
export default class LayoutUtils {
  /**
   * Initialize LayoutUtils class
   */
  constructor() {
  }

  /**
   * Given a layout skeleton, parse its structure and add ids to the layout, tabs and objects
   * Return a format expected to be accepted by the API - create layout route
   * @param {JSON} skeleton - layout as given by the user
   * @returns {JSON} newly validated layout
   */
  static fromSkeleton(skeleton) {
    const layout = clone(skeleton);
    delete layout.isOfficial;

    layout.id = objectId();
    if (layout.tabs) {
      layout.tabs.map((tab) => {
        tab.id = objectId();
        if (tab.objects) {
          tab.objects.map((object) => {
            object.id = objectId();
          });
        }
        return tab;
      });
    }
    return layout;
  }

  /**
   * Given a layout, send back a stringified version of it stripped of IDs
   * @param {JSON} layout - layout dto representation
   * @returns {string} - string version of the provided layout
   */
  static toSkeleton(layout) {
    const layoutCopy = {
      name: layout.name,
      tabs: [],
      displayTimestamp: layout.displayTimestamp || false,
      autoTabChange: layout.autoTabChange || 0,
    };
    layoutCopy.tabs = layout.tabs.map((tab) => {
      const tabCopy = {
        name: tab.name,
        objects: [],
      };
      tabCopy.objects = tab.objects.map((object) => {
        const objCopy = clone(object);
        delete objCopy.id;
        delete objCopy.autoSize;
        return objCopy;
      });
      return tabCopy;
    });
    return JSON.stringify(layoutCopy, null, 2);
  }
}
