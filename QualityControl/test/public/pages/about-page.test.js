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

import { strictEqual } from 'node:assert';

const ABOUT_PAGE_PARAM = '?page=about';

export const aboutPageTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test('should successfully load about page', { timeout }, async () => {
    await page.goto(`${url}${ABOUT_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    const location = await page.evaluate(() => window.location);
    strictEqual(location.search, '?page=about');
  });
  await testServiceStatus(testParent, page, 'qcg', timeout);
  await testServiceStatus(testParent, page, 'qc', timeout);
  await testServiceStatus(testParent, page, 'ccdb', timeout);
  await testServiceStatus(testParent, page, 'kafka', timeout);
};

const testServiceStatus = async (testParent, page, serviceName, timeout = 5000) => {
  await testParent
    .test(
      `should request info about ${serviceName.toUpperCase()} and store in statuses as RemoteData`,
      { timeout },
      async () => {
        const kind = await page.evaluate(
          (service) => window.model.aboutViewModel.findService(service)?.kind,
          serviceName,
        );

        strictEqual(kind, 'Success');
      },
    );
};
