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
   * Given a layout, send back a stringified version of it stripped of IDs
   * @param {JSON} layout
   * @returns {String}
   */
  static getLayoutSkeleton(layout) {
    const layoutCopy = {
      name: layout.name,
      tabs: []
    };
    layoutCopy.tabs = layout.tabs.map((tab) => {
      const tabCopy = {
        name: tab.name,
        objects: []
      };
      tabCopy.objects = tab.objects.map((object) => {
        const objCopy = JSON.parse(JSON.stringify(object));
        delete objCopy.id;
        delete objCopy.autoSize;
        return objCopy;
      });
      return tabCopy;
    });
    return JSON.stringify(layoutCopy, null, 2);
  }
}
