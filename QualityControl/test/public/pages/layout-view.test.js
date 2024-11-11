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

import { editLayoutTests } from './edit-layout.test.js';
export const layoutViewTests = async (url, page, timeout = 5000, testParent) => {
  // TODO: layout view tests go here
  await editLayoutTests(url, page, timeout, testParent);
};
