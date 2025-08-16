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

/**
 * Key used for passing CCDB monitor health status so that version of CCDB instance used is retrieved
 */
export const CCDB_MONITOR = 'ALIEN_ch.alice.o2.ccdb.webserver.EmbeddedTomcat_Nodes';

/**
 * Key for retrieving version of CCDB from the health object retrieved via CCDB_MONITOR key
 */
export const CCDB_VERSION_KEY = 'ccdb_version';

/**
 * Keys used by CCDB that are to be passed as 'X-Filter-Fields' when requesting details about a QcObject.
 * Implementation:
 * gitlab.cern.ch/grigoras/ccdb-local/-/blob/master/src/ch/alice/o2/ccdb/servlets/formatters/JSONFormatter.java#L136
 */
export const CCDB_FILTER_FIELDS = Object.freeze({
  ID: 'ETag',
  PATH: 'path',
  CREATED: 'Created',
  LAST_MODIFIED: 'Last-Modified',
  VALID_FROM: 'Valid-From',
  VALID_UNTIL: 'Valid-Until',
  INITIAL_VALIDITY: 'InitialValidityLimit',
  CONTENT_MD5: 'Content-MD5',
  CONTENT_TYPE: 'Content-Type',
  CONTENT_LOCATION: 'Content-Location',
  SIZE: 'Content-Length',
  FILE_NAME: 'fileName',
  METADATA: 'metadata', // While the request will ask for Metadata,
  // the response will not contain the metadata fields under the 'metadata' key
  // but under their own each individually key
});

// NodeJS makes the response headers lower case as it is built on the HTTP premise that headers are case insensitive
export const CCDB_RESPONSE_HEADER_KEYS = Object.freeze({
  PATH: 'path',
  ID: 'etag',
  VALID_FROM: 'valid-from',
  VALID_UNTIL: 'valid-until',
  CREATED_AT: 'created',
  LOCATION: 'location',
  CONTENT_LOCATION: 'content-location',
  REPLICAS: 'replicas',
  LAST_MODIFIED: 'last-modified',
});

export const CCDB_RESPONSE_BODY_KEYS = Object.freeze({
  ID: 'ETag',
  PATH: 'path',
  VALID_FROM: 'Valid-From',
  VALID_UNTIL: 'Valid-Until',
  CREATED: 'Created',
});
