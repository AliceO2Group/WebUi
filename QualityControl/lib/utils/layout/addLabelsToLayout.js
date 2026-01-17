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
 * Method to identify the unique prefix (encountering first '/') of objects and add it as a set of labels to layout
 * @param {LayoutDto} layout - layout object to which labels will be added
 * @returns {{...LayoutDto, labels: string[]}} - layout object with added labels
 */
export const addLabelsToLayout = (layout) => {
  const labelsSet = new Set();
  layout.tabs?.forEach((tab) => {
    tab.objects?.forEach((obj) => {
      if (obj.name) {
        const [prefix] = obj.name.split('/');
        labelsSet.add(prefix);
      }
    });
  });
  return { ...layout, labels: Array.from(labelsSet) };
};
