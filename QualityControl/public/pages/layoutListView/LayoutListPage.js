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

import FolderComponent from '../../folder/view/FolderComponent.js';
import { h } from '/js/src/index.js';

/**
 * Shows a list of layouts grouped by user and more
 * @param {Array<FolderModel>} folderModels - LayoutListModel.folders: The Folders used by LayoutListModel
 * @returns {vnode} - virtual node element
 */
export default function (folderModels) {
  return h('.scroll-y.absolute-fill', {
    style: 'display: flex; flex-direction: column',
  }, Array.from(folderModels.values()).map(FolderComponent));
}
