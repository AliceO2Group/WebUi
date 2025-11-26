/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { Box1_2 } from '~/components/box';
import { CertsTable } from '~/components/certs/certs-table';

export const clientLoader = async () => ({});

// eslint-disable-next-line jsdoc/require-jsdoc
export default function Overview() {
  return (
    <div className="grid-1-2">
      <Box1_2 link={null}>
        <div className="flex-row justify-center">
          <h1> Registered services</h1>
        </div>
        <CertsTable certs={[]} />
      </Box1_2>
      <Box1_2 link="/certs/new">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Create New Certificate</h2>
          <p>Click here to create a new certificate.</p>
        </div>
      </Box1_2>
    </div>
  );
}
