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
 * @property {string} workflowTemplate - the workflow template to use for the deployment, can be optional if selectedConfiguration is provided
 * @property {string} [selectedConfiguration] - the selected configuration for the deployment, can be optional if workflowTemplate is provided
 * @property {Map<string, object>} [userVars] - user variables to be used in the deployment, if none provided, ECS will use the default ones
 * @property {string[]} detectors - list of detectors to be deployed
 */
