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
 * LayoutRepository class to handle CRUD operations for Layouts.
 */
export default class LayoutRepository {
  findLayoutById(data, layoutId) {
    return data.layouts.find((layout) => layout.id === layoutId);
  }

  findLayoutByName(data, layoutName) {
    return data.layouts.find((layout) => layout.name === layoutName);
  }

  createLayout(data, newLayout) {
    data.layouts.push(newLayout);
  }

  updateLayout(layout, newData) {
    Object.assign(layout, newData);
  }

  deleteLayout(data, layout) {
    const index = data.layouts.indexOf(layout);
    data.layouts.splice(index, 1);
  }

  listLayouts(data, filter = {}) {
    return data.layouts.filter((layout) =>
      (filter.owner_id === undefined || layout.owner_id === filter.owner_id)
            && (filter.name === undefined || layout.name === filter.name));
  }
}
