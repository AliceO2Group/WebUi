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
 * @typedef {Object.<string, RestrictionsEntry>} Restrictions
 * 
 * Object which is a map of types.
 * Keys are taken from existing configuration.
 * Values are describing what is expected type of value held there.
 * 
 * For example for the given configuration:
 * ```
 *  {
      active: 'false',
      moduleName: 'QualityControl',
      extendedTaskParameters: {
        default: {
          default: {
            verbose : 'false',
            retryDelay: '10',
            databaseUrl: 'https://alice-ccdb.cern.ch'
          }
        }
      },
      dataSources: [
        {
          name: 'CTP Config',
          path: 'CTP/Config/Config',
          active: 'true'
        },
        {
          name: 'CTP Scalers',
          path: 'CTP/Calib/Scalers',
          active: 'false'
        }
      ],
    }
 * ```
 * 
 * The Restrictions are:
 * ```
 *  {
 *    active: 'boolean',
 *    moduleName: 'string',
 *    extendedTaskParameters: {
 *      default: {
 *        default: {
 *          verbose: 'boolean',
 *          retryDelay: 'number',
 *          databaseUrl: 'string'
 *        }
 *      }
 *    },
 *    dataSources: [
 *      {
 *        name: 'string',
 *        path: 'string',
 *        active: 'boolean'
 *      }
 *    ]
 *  }
 * ```
 */

/**
 * A value in a `Restrictions` object can be:
 * - a string literal 'string', 'boolean', 'number' or 'array'
 * - nested Restrictions
 *
 * @typedef { 'string' | 'boolean' | 'number' | Restrictions | Restrictions[] } RestrictionsEntry
 */
