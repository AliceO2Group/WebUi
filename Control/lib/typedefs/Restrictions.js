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
 * @typedef {RestrictionsEntry | Object.<string, RestrictionsEntry>} Restrictions
 * Object which is a map of types.
 * Keys are taken from existing configuration.
 * Values are describing what is the expected type of value held under that key.
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
          active: 'true',
          count: '5'
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
 *      [
 *        {
 *          name: 'string',
 *          path: 'string',
 *          active: 'boolean',
 *          count: 'number'
 *        },
 *        {
 *          name: 'string',
 *          path: 'string',
 *          active: 'boolean'
 *        }
 *      ],
 *      {
 *        name: 'string',
 *        path: 'string',
 *        active: 'boolean'
 *      },
 *      null
 *    ]
 *  }
 * ```
 */

/**
 * A value in a `Restrictions` object can be:
 * - a string literal describing a primitive: 'string', 'boolean' or 'number'
 * - nested Restrictions
 * - ArrayRestrictions object
 * @typedef { 'string' | 'boolean' | 'number' | Restrictions | ArrayRestrictions } RestrictionsEntry
 */

/**
 * ArrayRestrictions is a data structure which holds the info about objects held in an array.
 * It always is of length three:
 *  - at index 0 there is a nested array which describes Restrictions of each object held in input array
 *  - at index 1 there is a 'blueprint' Restrictions in case user decides to create a new object,
 *      or null if source array contains no objects
 *  - at index 2 there is a 'blueprint' ArrayRestrictions in case user decides to create a directly nested array
 *      or null if source array contains no nested arrays
 * If user creates an object on the frontend, it is pre-populated according to the blueprint at index 1
 * If user creates an array on the frontend, its blueprint is populated with the value at index 2
 * 
 * Example ArrayRestrictions object:
 * [
 *   [
 *     { name: 'string', id: 'number', active: 'boolean' }, // object Restrictions
 *     { name: 'string', id: 'string', active: 'string' }, // another object Restrictions
 *     'string', // primitive values held in the array
 *     'number',
 *     [['boolean', { title: 'string' }], { title: 'string' }, null] // nested array
 *   ],
 *   { name: 'string' }, // intersection of the objects
 *   [[], { title: 'string' }, null] // blueprint for a new array
 * ]
 * @typedef { [Array<Restrictions>, Restrictions, Restrictions] } ArrayRestrictions
 */
