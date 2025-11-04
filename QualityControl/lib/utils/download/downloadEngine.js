/* eslint-disable curly */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-case-declarations */
/* eslint-disable @stylistic/js/max-len */
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

import { pipeline } from 'node:stream';
import { createGzip } from 'node:zlib';
import { promisify } from 'node:util';

import { LayoutDomainStorage } from './classes/domain/LayoutDomainStorage.js';
import { DownloadMode } from './enum/DownloadMode.js';
import { NameTemplateOption } from './enum/NameTemplateOption.js';
import { createTar } from './tar/tar.js';

const CONTENT_LENGTH_HEADER = 'Content-Length';
const CONTENT_TYPE_HEADER = 'Content-Type';
const CONTENT_TYPE_DEFAULT = 'application/root';
const _pipelineAsync = promisify(pipeline);

/** @import { LayoutDomain } from './classes/domain/LayoutDomain.js'; */
/** @import { MapStorage } from './classes/domain/MapStorage.js'; */
/** @import { DownloadConfigDomain } from './classes/domain/DownloadConfigDomain.js' */
/** @import { ObjectDomain } from './classes/domain/ObjectDomain.js'; */

/**
 * main download function
 * @param {LayoutDomain} downloadLayout
 * @param {DownloadConfigDomain} downloadConfiguration
 * @param {number} runNumber
 * @param {Response} res
 * @returns {Promise<void>}
 */
export async function download(downloadLayout, downloadConfiguration, runNumber, res) {
  switch (downloadConfiguration.downloadMode) {
    case DownloadMode.object:
      let file = new File([], '');
      const objects = downloadLayout.tabs.flatMap((tab) => tab.objects.filter((object) => downloadConfiguration.objectIds.includes(object.id)));
      if (objects.length > 1) {
        // Multiple objects requested
        const files = await requestObjects(objects, downloadConfiguration, undefined, runNumber);
        file = await createTar(files, processFileNameTemplate(downloadConfiguration.archiveNameTemplateOptions, undefined, undefined, runNumber));
      } else {
        // One object requested
        // Dangerous index access, fix later
        const object = downloadLayout.tabs.flatMap((tab) => tab.objects.find((object) => downloadConfiguration.objectIds[0] == object.id))[0];
        if (object == undefined)
          throw new Error('ObjectId does not exist in given layout data');
        file = await requestObject(object, downloadConfiguration, undefined, runNumber);
      }
      setHeaders(res, file, false);
      await _streamFileToResponse(file, res);
      break;
    case DownloadMode.tab:
      // const objects = downloadLayout.tabs.flatMap((tab) => tab.objects.filter((object) => downloadConfiguration.objectIds.includes(object.id)))
      let tabFiles = [];
      const tabs = downloadLayout.tabs.filter((tab) => downloadConfiguration.tabIds.some((id) => id == tab.id));
      if (tabs == undefined)
        throw new Error('TabId does not exist in given layout data');
      if (objectRequestLimiter(tabs.flatMap((tab) => tab.objects).length)) {
        throw new Error('Too many objects requested at once');
      }
      if (tabs.length > 1) {
        // multiple tabs
        const tabPromises = [];
        tabs.forEach((tab) => {
          tabPromises.push(requestTab(tab, downloadConfiguration, runNumber));
        });
        const tabsFiles = await Promise.all(tabPromises);
        console.log(tabsFiles);
        tabFiles = tabsFiles.flat();
        console.log(tabFiles);
      } else {
        // single tab
        tabFiles = await requestTab(tabs[0], downloadConfiguration, runNumber);
      }
      const tarFile = await createTar(tabFiles, processFileNameTemplate(downloadConfiguration.archiveNameTemplateOptions, undefined, undefined, runNumber));
      setHeaders(res, tarFile, true);
      await streamArchiveToResponse(tarFile, res);
      break;
    case DownloadMode.layout:
      break;
    default:
      break;
  }
}

/**
 * save download data to cache
 * @param {MapStorage} mapStorage - map storage used to store data from post request
 * @param {LayoutDomain} layoutDomain - layoutDomain data to store.
 * @param {DownloadConfigDomain} configDomain - configDomain data to store.
 * @param {number} userId - userId of user wanting to download.
 * @returns {`${string}-${string}-${string}-${string}-${string}`} - UUID key of Map entry
 */
export function saveDownloadData(mapStorage, layoutDomain, configDomain, userId) {
  // Delete existing download Layout data.
  mapStorage.deleteByUserId(userId);
  const layoutDomainStorage = new LayoutDomainStorage(layoutDomain.id, layoutDomain.name, layoutDomain.tabs, userId);
  const insertedLayoutKey = mapStorage.writeRequest(layoutDomainStorage, configDomain);
  return insertedLayoutKey;
}

/**
 * load saved data from cache
 * @param {MapStorage} mapStorage - map storage used to retrieve data from earlier post request
 * @param {string} key - UUID key of Map entry to retrieve layout by
 * @returns {[LayoutDomainStorage, DownloadConfigDomain] | undefined} - found download request if any
 */
export function loadSavedData(mapStorage, key) {
  return mapStorage.readRequest(key);
}

/**
 * Limit the number of requested objectIds
 * @param {number} idsCount - number of requested id's
 * @returns {boolean} - true if too many ids have been requested
 */
function objectRequestLimiter(idsCount) {
  return idsCount > 40;
}

/**
 * set the right headers on the response depending on
 * if the response will be an archive or not.
 * @param {Response} res
 * @param {File} file
 * @param {boolean} isArchive
 * @returns {void}
 */
function setHeaders(res, file, isArchive) {
  res.setHeader('content-disposition', `inline;filename="${file.name}"`);
  // Filesize is wrong and thus breaks stream... We cannot tell the size if the file is going to be gzipped and streamed at once....
  isArchive ? undefined : res.setHeader('content-type', file.size);
  res.setHeader('content-type', isArchive ? 'application/gzip' : 'application/root');
  return;
}

/**
 * Stream the archive file into the response to the user.
 * @param {File} tarFile
 * @param {Response} res
 * @returns {Promise<void>}
 */
async function streamArchiveToResponse(tarFile, res) {
  const gzip = createGzip();
  const read = tarFile.stream();
  try {
    await _pipelineAsync(read, gzip, res);
  } catch (error) {
    console.log(error?.message ?? error);
    throw error;
  }
}

/**
 * Stream the ROOT file  into our reponse back to the user.
 * @param {File} file - Root file
 * @param {Response} res - Outgoing response object we'll write our data into
 * @returns {Promise<void>}
 */
async function _streamFileToResponse(file, res) {
  // We will stream the data from QCDB's answer directly back to the user.
  await _pipelineAsync(file.stream(), res);
}

/**
 * Tab becomes our tab.tar.gz or MFT.tar.gz with our objects within
 * @param {TabDomain} tab
 * @param {DownloadConfigDomain} downloadConfiguration
 * @param {number} runNumber
 * @returns {Promise<File[]>}
 */
async function requestTab(tab, downloadConfiguration, runNumber) {
  return await requestObjects(tab.objects, downloadConfiguration, tab.name, runNumber);
}

/**
 * Request objects from QCDB
 * @param {ObjectDomain[]} objects
 * @param {DownloadConfigDomain} downloadConfiguration
 * @param {string} [tabName]
 * @param {number} [runNumber]
 * @returns {Promise<File[]>}
 */
async function requestObjects(objects, downloadConfiguration, tabName, runNumber) {
  const requestPromises = [];
  objects.forEach((object) => {
    requestPromises.push(requestObject(object, downloadConfiguration, tabName, runNumber));
  });
  const objectFiles = await Promise.all(requestPromises);
  return objectFiles;
}

/**
 *  Request QCDB ROOT object.
 * @param {ObjectDomain} object
 * @param {DownloadConfigDomain} downloadConfiguration
 * @param {string} [tabName='']
 * @param {number} [runNumber=0]
 * @returns {Promise<File>}
 */
async function requestObject(object, downloadConfiguration, tabName = '', runNumber = 0) {
  try {
    // const response = await fetch(`http://localhost:8083/download/${object.id}`);
    const response = await fetch(`http://ali-qcdb-gpn.cern.ch:8083/download/${object.id}`);
    if (!response.ok) {
      console.log(`QCDB returned ${response.status} ${response.statusText}`);
      throw new Error(`Cannot get ROOT file from QCDB object id: ${object.id}`);
    }
    const contentLength = response.headers.get(CONTENT_LENGTH_HEADER);
    console.log(`ROOT size (bytes): ${contentLength}`);
    return _getFileFromResponse(response, processFileNameTemplate(downloadConfiguration.objectNameTemplateOptions, object, tabName, runNumber, downloadConfiguration.pathNameStructure));
  } catch (error) {
    console.log(error?.message ?? error);
    throw error;
  }
}

/**
 * process the nameTemplateOptions for this file.
 * @param {NameTemplateOption[]} nameTemplateOption
 * @param {ObjectDomain | undefined} [object=undefined]
 * @param {string} [tabName='']
 * @param {number} runNumber
 * @param {boolean} [pathNameStructure=false]
 * @returns {string}
 */
function processFileNameTemplate(nameTemplateOption, object = undefined, tabName = '', runNumber, pathNameStructure = false) {
  // Make sure that if the tabname is set it will be the root folder of its objects...
  let rv = tabName === '' ? tabName : `${tabName}/`;
  const nameStartingLength = tabName.length + 1;
  // Prevent tar from creating a folder structure if wished for.
  const index = object?.name.lastIndexOf('/') ?? 0;
  const name = pathNameStructure ? object?.name : object?.name.slice(index + 1, object?.name.length - 1);
  const objectId = object?.id ?? '';
  nameTemplateOption.forEach((nameTemplateOption) => {
    switch (nameTemplateOption) {
      case NameTemplateOption.objectName:
        rv += rv.length > nameStartingLength ? `_${name}` : name;
        break;
      case NameTemplateOption.objectId:
        rv += rv.length > nameStartingLength ? `_${objectId}` : objectId;
        break;
      case NameTemplateOption.tabName:
        rv += rv.length > nameStartingLength ? `_${tabName}` : tabName;
        break;
      case NameTemplateOption.runNumber:
        rv += rv.length > nameStartingLength ? `_${runNumber}` : runNumber;
        break;
    }
  });
  return rv;
}

/**
 * Get a ROOT file from a QCDB download request.
 * @param {globalThis.Response} response - response from QCDB.
 * @param {string} filename - filename for the resulting file.
 * @returns {Promise<File>} - ROOT file from response.
 */
async function _getFileFromResponse(response, filename) {
  const contentType = response.headers.get(CONTENT_TYPE_HEADER);
  const blob = await response.blob();
  const fullFilename = `${filename}.root`;
  const file = new File([blob], fullFilename, { type: contentType ?? CONTENT_TYPE_DEFAULT });
  return file;
}
