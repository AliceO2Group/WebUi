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

import { h, iconDataTransferDownload } from '/js/src/index.js';

/**
 * Download button for downloading an object from QCDB download service.
 * @param {ObjectViewModel} objectViewModel - which contains the download url.
 * @param {string} qcObjectId - QCDB object id.
 * @returns {h} - Download button element.
 * @import ObjectViewModel from '../pages/objectView/ObjectViewModel';
 */
export default (objectViewModel, qcObjectId) => h('a.btn#download-button', {
  title: 'Download object',
  target: '_blank',
  href: objectViewModel.getDownloadQcdbObjectUrl(qcObjectId),
}, iconDataTransferDownload());
