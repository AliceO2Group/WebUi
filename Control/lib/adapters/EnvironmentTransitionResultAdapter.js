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
 * EnvironmentTransitionResultAdapter - Given an object with information about an environment transition
 * return a minified version of it with only the summary
 */
class EnvironmentTransitionResultAdapter {
  /**
   * EnvironmentTransitionResultAdapter
   */
  constructor() { }

  /**
   * Converts the given object to an entity object.
   * @static
   * @param {ControlEnvironmentReply} transitionResult - as from AliECS
   * @return {EnvironmentTransitionResult} information on the transition result of the environment
   */
  static toEntity(transitionResult) {
    const {
      id,
      state,
      currentRunNumber,
    } = transitionResult;

    return {
      id,
      state,
      currentRunNumber,
    };
  }
}

module.exports.EnvironmentTransitionResultAdapter = EnvironmentTransitionResultAdapter;
