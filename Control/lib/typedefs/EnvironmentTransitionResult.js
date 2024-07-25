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
 * @type {EnvironmentTransitionResult}
 *
 * Object describing the reply from AliECS Core with regards to the state of an environment following a transition
 * @param {string} id - environment id on which the transition was performed
 * @param {string} state - current state of environment
 * @param {number} [currentRunNumber] - run number if the environment is in RUNNING state
 */
