import { LayoutData } from './classes/data/LayoutData.js';
import { DownloadConfigData } from './classes/data/DownloadConfigData.js';
import { mapDownloadConfigToDomain } from './classes/DownloadConfigMapper.js';

/** @import { LayoutDomain } from './classes/domain/LayoutDomain.js'; */
/** @import { Request, Response, NextFunction } from 'express' */

/**
 * @typedef {object} Query
 * @property {string} tabIds
 * @property {string} objectIds
 * @property {string|string[]} archiveNameTemplateOptions
 * @property {string|string[]} objectNameTemplateOptions
 * @property {string} key
 */

/**
 * parse request to download configuration
 * @param {Request<Query>} req
 * @returns {DownloadConfigDomain}
 */
export function parseRequestToConfig(req) {
  const plainConfigReq = req.query;
  // Create config
  // Data
  const configData = DownloadConfigData.mapFromPlain(plainConfigReq);
  // Domain
  const configDomain = mapDownloadConfigToDomain(configData);
  return configDomain;
}

/**
 * parse request to download layout
 * @param {Request<Query>} req
 * @returns {LayoutDomain}
 */
export function parseRequestToLayout(req) {
  // Create Layout object
  const jsonBody = req.body;
  if (Object.keys(jsonBody).length === 0) {
    throw new Error('Json cannot be empty');
  }
  // Data
  const layout = LayoutData.mapFromPlain(jsonBody);
  // Domain
  if (layout.id == 0) {
    throw new Error('Layout cannot have an empty id');
  }
  const layoutDomain = layout.mapToDomain();
  if (layout == undefined) {
    throw new Error('Layout not found.');
  }
  return layoutDomain;
}
