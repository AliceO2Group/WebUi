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
 * @typedef {object} User
 * @property {number} id
 * @property {string} username
 * @property {string} [name]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {object} Layout
 * @property {number} id
 * @property {string} name
 * @property {string} [description]
 * @property {boolean} display_timestamp
 * @property {number} auto_tab_change_interval
 * @property {string} owner_username
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {object} Tab
 * @property {number} id
 * @property {string} name
 * @property {number} layout_id
 * @property {number} column_count
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {object} Chart
 * @property {number} id
 * @property {string} [object_name]
 * @property {boolean} [ignore_defaults]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {object} GridTabCell
 * @property {number} id
 * @property {number} chart_id
 * @property {number} row
 * @property {number} col
 * @property {number} tab_id
 * @property {number} [row_span]
 * @property {number} [col_span]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {object} Option
 * @property {number} id
 * @property {string} name
 * @property {string} type
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {object} ChartOption
 * @property {number} id
 * @property {number} chart_id
 * @property {number} option_id
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */
