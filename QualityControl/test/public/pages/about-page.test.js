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

import { ok, strictEqual } from 'node:assert';
import { IntegratedServices } from '../../../common/library/enums/Status/integratedServices.enum.js';
import { ServiceStatus } from '../../../common/library/enums/Status/serviceStatus.enum.js';

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

  await testParent.test('should display message when service errored', { timeout }, async () => {
    const ERROR_MESSAGE = 'Service Error';

    const requestHandler = (interceptedRequest) => {
      const url = interceptedRequest.url();

      if (url.includes(`/api/status/${IntegratedServices.KAFKA}`)) {
        interceptedRequest.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            name: IntegratedServices.KAFKA,
            status: {
              ok: false,
              category: ServiceStatus.ERROR,
            },
            extras: {
              message: ERROR_MESSAGE,
            },
          }),
        });
      } else {
        interceptedRequest.continue();
      }
    };

    try {
      // Enable interception and attach the handler
      await page.setRequestInterception(true);
      page.on('request', requestHandler);

      await page.reload({ waitUntil: 'networkidle0' });

      const extras = await page.evaluate(
        (serviceStatus, serviceName) => {
          const query = `#service-status-${serviceStatus} #${serviceName} .panel .flex-row div:nth-child(2)`;
          return Array.from(document.querySelectorAll(query)).map((element) => element.textContent);
        },
        ServiceStatus.ERROR.toLowerCase(),
        IntegratedServices.KAFKA,
      );

      ok(extras.includes(ERROR_MESSAGE), `errored service should contain message '${ERROR_MESSAGE}'`);
    } finally {
      // Cleanup: remove listener and disable interception
      page.off('request', requestHandler);
      await page.setRequestInterception(false);
    }
  });

  await testParent.test('should have "NOT CONFIGURED" status when service is not configured', { timeout }, async () => {
    const requestHandler = (interceptedRequest) => {
      const url = interceptedRequest.url();

      if (url.includes(`/api/status/${IntegratedServices.KAFKA}`)) {
        interceptedRequest.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            name: IntegratedServices.KAFKA,
            status: {
              ok: false,
              category: ServiceStatus.NOT_CONFIGURED,
            },
            extras: {},
          }),
        });
      } else {
        interceptedRequest.continue();
      }
    };

    try {
      // Enable interception and attach the handler
      await page.setRequestInterception(true);
      page.on('request', requestHandler);

      await page.reload({ waitUntil: 'networkidle0' });

      const exists = await page.evaluate(
        (serviceStatus, serviceName) =>
          document.querySelector(`#service-status-${serviceStatus} #${serviceName}`) !== null,
        ServiceStatus.NOT_CONFIGURED.toLowerCase(),
        IntegratedServices.KAFKA,
      );

      ok(exists, `Service '${IntegratedServices.KAFKA}' should have status '${ServiceStatus.NOT_CONFIGURED}'`);
    } finally {
      // Cleanup: remove listener and disable interception
      page.off('request', requestHandler);
      await page.setRequestInterception(false);
    }
  });
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
