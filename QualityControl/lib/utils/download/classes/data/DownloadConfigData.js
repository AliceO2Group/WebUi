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
/* eslint-disable jsdoc/reject-any-type */
import { DownloadMode } from '../../enum/DownloadMode.js';

export class DownloadConfigData {
  /**
   * constructor
   * @param {string[]} tabIds - tabIds to download
   * @param {string[]} objectIds - objectIds to download
   * @param {string[]} archiveNameTemplateOptions - name options for the archive (*.tar.gz)
   * @param {string[]} objectNameTemplateOptions - name options for the individual object files
   * @param {string} downloadMode - download mode (layout/tab/object)
   * @param {boolean} pathNameStructure - enable full pathname structure
   */
  constructor(
    tabIds, objectIds, archiveNameTemplateOptions,
    objectNameTemplateOptions, downloadMode, pathNameStructure,
  ) {
    this.tabIds = tabIds,
    this.objectIds = objectIds,
    this.archiveNameTemplateOptions = archiveNameTemplateOptions,
    this.objectNameTemplateOptions = objectNameTemplateOptions,
    this.downloadMode = downloadMode,
    this.pathNameStructure = pathNameStructure;
  }

  tabIds;

  objectIds;

  archiveNameTemplateOptions;

  objectNameTemplateOptions;

  downloadMode;

  pathNameStructure;

  /**
   * mapper from plain object to instance of DownloadConfigData.
   * @static
   * @param {any} downloadConfigPlain - plain object download config.
   * @returns {DownloadConfigData} - mapped DownloadConfigData.
   */
  static mapFromPlain(downloadConfigPlain) {
    if (!downloadConfigPlain || typeof downloadConfigPlain !== 'object') {
      throw new Error('invalid DownloadConfig');
    }
    return new DownloadConfigData(Array.isArray(downloadConfigPlain.tabIds) ?
      downloadConfigPlain.tabIds : downloadConfigPlain.tabIds?.split(',') ??
    [], Array.isArray(downloadConfigPlain.objectIds) ? downloadConfigPlain.objectIds :
      downloadConfigPlain.objectIds?.split(',') ?? [], Array.isArray(downloadConfigPlain.archiveNameTemplateOptions) ?
      downloadConfigPlain.archiveNameTemplateOptions : downloadConfigPlain.archiveNameTemplateOptions?.split(',')
    ?? [], Array.isArray(downloadConfigPlain.objectNameTemplateOptions) ?
      downloadConfigPlain.objectNameTemplateOptions : downloadConfigPlain.objectNameTemplateOptions?.split(',')
    ?? [], downloadConfigPlain?.downloadMode ??
    DownloadMode.OBJECT, downloadConfigPlain?.pathNameStructure == 'true' ? true : false);
  }
}
