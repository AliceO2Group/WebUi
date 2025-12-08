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

import type { Cert } from '~/feature/cert/types/cert';
import { Box1_1 } from '~/ui/box';
import { CertsFilter } from '~/feature/cert/components/certs-filter';
import { CertsTable } from '~/feature/cert/components/certs-table';

/**
 *
 */
export default function CertsTableRouteView({ certs }: { certs: Cert[] }) {
  return <Box1_1 link={null}>
    <CertsFilter />
    <CertsTable certs={certs} />
  </Box1_1>;
}
