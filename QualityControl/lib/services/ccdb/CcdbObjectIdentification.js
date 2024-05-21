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
 * @typedef CcdbObjectIdentification
 *
 * @property {string|regex} path - full name of the object or regex form
 * @property {number} [validFrom] - timestamp with starting point of validity
 * @property {number} [validUntil] - timestamp with ending point of validity
 * @property {string} [id] - unique id of the object also known as etag
 * @property {Map<string, string>} [filters] - list of metadata attributes (K;V) pairs to be applied to query a
 * specific object such as `{RunNumber: 1234567}`
 */
