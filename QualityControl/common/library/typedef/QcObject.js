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
 * @typedef QcObject
 *
 * @property {object} root - ROOT object in JSON format
 * @property {Array<CcdbObjectIdentification>} versions
 * @property {Array<string>} drawingOptions - list of drawing options
 * @property {Array<string>} displayHints - list of display hints
 * @property {string} [layoutDisplayOptions] - displayOptions from layout configuration if object is retrieved from one
 * @property {string} [layoutName] - name of the layout if object is retrieved from one
 * @property {boolean} [ignoreDefaults] - should the object be plotted with its drawingOptions and displayHints or not
 */
