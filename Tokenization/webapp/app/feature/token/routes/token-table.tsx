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

import TokenTableRouteView from '../views/token-table';
import { Spinner } from '~/ui/spinner';
import { useTokenQueries } from '../hooks/api/useTokenQueries';

/**
 * Standalone route rendering the full tokens table with live data.
 */
export default function TokensTable() {
  const { list } = useTokenQueries();
  const { data, isPending, isError, error } = list();

  if (isPending) {
    return <Spinner size={3} />;
  }

  if (isError) {
    return <div role="alert">Failed to load tokens: {(error as Error).message}</div>;
  }

  return <TokenTableRouteView tokens={data ?? []} />;
}
