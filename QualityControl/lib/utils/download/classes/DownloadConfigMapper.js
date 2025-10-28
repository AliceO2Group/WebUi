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
import { DownloadConfigDomain } from '../classes/domain/DownloadConfigDomain.js';
import { NameTemplateOption } from '../enum/NameTemplateOption.js';
import { DownloadMode } from '../enum/DownloadMode.js';

/**
 * map download config to domain model
 * @param {string} downloadConfigData - DownloadconfigData to map
 * @returns {DownloadConfigDomain} - mapped DownloadConfigDomain
 */
export function mapDownloadConfigToDomain(downloadConfigData) {
  const archiveNameTemplateOptions = downloadConfigData.archiveNameTemplateOptions.map(mapNameTemplateOption);
  const objectNameTemplateOptions = downloadConfigData.objectNameTemplateOptions.map(mapNameTemplateOption);
  const downloadMode = mapDownloadMode(downloadConfigData.downloadMode);
  // eslint-disable-next-line @stylistic/js/max-len
  return new DownloadConfigDomain(downloadConfigData.tabIds, downloadConfigData.objectIds, archiveNameTemplateOptions, objectNameTemplateOptions, downloadMode, downloadConfigData.pathNameStructure);
}

/**
 * map string to name template option
 * @param {string} nameTemplateOption - string representation
 * @returns {number} - name template option
 */
function mapNameTemplateOption(nameTemplateOption) {
  if (typeof nameTemplateOption === 'string') {
    nameTemplateOption = nameTemplateOption.trim();
    nameTemplateOption = nameTemplateOption.toLowerCase();
    const mappedNameTemplateOption = NameTemplateOption[nameTemplateOption];
    if (mappedNameTemplateOption === undefined) {
      throw new Error('Failed to map NameTemplateOption, perhaps an invalid option was passed?');
    } else {
      return mappedNameTemplateOption;
    }
  } else {
    throw new Error('Failed to map NameTemplateOption, it should be a string');
  }
}

/**
 * map number to download mode.
 * @param {string} downloadMode - download mode (tab/object/layout)
 * @returns {number} - mapped downloadmode
 */
function mapDownloadMode(downloadMode) {
  if (typeof downloadMode === 'string') {
    downloadMode = downloadMode.trim();
    downloadMode = downloadMode.toLowerCase();
    const mappedDownloadMode = DownloadMode[downloadMode];
    if (mappedDownloadMode === undefined) {
      throw new Error('Failed to map DownloadMode, perhaps an invalid option was passed?');
    } else {
      return mappedDownloadMode;
    }
  } else {
    throw new Error('Failed to map DownloadMode, it should be a string');
  }
}
