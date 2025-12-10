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

import { TokenForm } from '~/feature/token/components/token-form';
import { Box1_1 } from '~/ui/box';
import { Spinner } from '~/ui/spinner';
import { useTokenQueries } from '../hooks/api/useTokenQueries';

/**
 *
 */
export default function CreateTokenView() {
  const { services } = useTokenQueries();
  const { data, isPending, isError, error } = services();

  if (isPending) {
    return <Spinner size={3} />;
  }

  if (isError) {
    return <div role="alert">Failed to load services: {(error as Error).message}</div>;
  }

  return (
    <Box1_1 link={null}>
      <TokenForm serviceOptions={data} />
    </Box1_1>
  );
}
