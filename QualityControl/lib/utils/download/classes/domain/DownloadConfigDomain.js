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
export class DownloadConfigDomain {
  /**
   * constructor
   * @param {string[]} tabIds - tabIds to download
   * @param {string[]} objectIds - objectIds to download
   * @param {NameTemplateOption[]} archiveNameTemplateOptions - name options for the archive (*.tar.gz)
   * @param {NameTemplateOption[]} objectNameTemplateOptions - name options for the individual object files
   * @param {DownloadMode} downloadMode - download mode (layout/tab/object)
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
}
