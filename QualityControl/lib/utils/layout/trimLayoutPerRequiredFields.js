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
 * Trims a layout object to only include requested fields
 * @param {LayoutDto} layout - layout object to be trimmed
 * @param {string[]} [fields = []] - Array of field names to include in the returned layout object
 * @returns {Partial<LayoutDto>} - Trimmed layout object
 */
export const trimLayoutPerRequiredFields = (layout, fields = []) => {
  if (fields.length === 0) {
    return layout;
  }
  const trimmedLayout = {};
  for (const field of fields) {
    if (field in layout) {
      trimmedLayout[field] = layout[field];
    }
  }
  return trimmedLayout;
};
