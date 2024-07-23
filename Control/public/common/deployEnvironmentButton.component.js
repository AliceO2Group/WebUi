/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

import { h } from '/js/src/index.js';

/**
 * Builds a component with a set of buttons to allow users to create environments based on mapped workflow templates
 * @param {boolean} isLoading - if the button should be displayed as loading
 * @param {boolean} isReady - if environment creation is ready to be deployed
 * @param {void} onclick - deploying action of the environment
 * @returns {vnode}
 */
export const deployEnvironmentButton = (isLoading = false, isReady = false, onclick) =>
  h('.w-100.text-center', [
    h('button.btn.btn-primary#deploy-env', {
      class: isLoading ? 'loading' : '',
      disabled: !isReady || isLoading,
      onclick,
      title: 'Deploy environment',
    }, 'Deploy'),
  ]);
