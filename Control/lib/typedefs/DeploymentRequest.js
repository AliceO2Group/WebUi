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
 * @typedef DeploymentRequest
 *
 * Deployment request as needed to be sent by the user to the API
 *
 * @property {string} template - the template to use for the deployment
 * @property {string} [repository] - the repository to use for the deployment
 * @property {string} [revision] - the revision to use for the deployment
 * @property {string} [selectedConfiguration] - the selected configuration for the deployment, can be optional if template is provided
 * @property {boolean} [shouldAutoTransition] - whether the deployment should automatically transition to the next state after creation
 * @property {Map<string, object>} [userVars] - user variables to be used in the deployment, if none provided, ECS will use the default ones
 * @property {string[]} detectors - list of detectors to be deployed
 */
