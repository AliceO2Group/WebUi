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
 * @typedef {Object.<string, TypeMapEntry>} TypeMap
 * 
 * Object which is a map of types.
 * Keys are taken from existing configuration.
 * Values are describing what is expected type of value held there.
 * 
 * For example for the given configuration:
 * ```
 *  {
 *      name: "Alice",
 *      age: 30,
 *      friends: [{ name: "Bob", isBald: true }, { name: "John", surname: "Doe" }],
 *      hasCar: true,
 *      carData: { brand: "BMW", works: false }
 *  }
 * ```
 * 
 * The TypeMap is:
 * ```
 *  {
 *      name: "string",
 *      age: "number",
 *      friends: [{ name: "string", isBald: "boolean" }, { name: "string", surname: "string" }],
 *      hasCar: "boolean",
 *      carData: { brand: "string", works: "boolean" }
 *  }
 * ```
 */

/**
 * A value in a `TypeMap` object can be:
 * - a string literal "string", "boolean", or "number"
 * - nested TypeMap
 * - array of nested TypeMaps
 *
 * @typedef { "string" | "boolean" | "number" | TypeMap | TypeMap[] } TypeMapEntry
 */
