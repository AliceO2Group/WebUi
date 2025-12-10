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
import { useParams } from 'react-router';

import TokenDetailsView from '../views/token-details';
import { Spinner } from '~/ui/spinner';
import { useTokenQueries } from '../hooks/api/useTokenQueries';

/**
 * Token details route that coordinates TanStack Query requests.
 */
export default function Details() {
  const params = useParams();
  const tokenId = params.tokenId ?? '';
  const { details, logs } = useTokenQueries();
  const tokenQuery = details(tokenId);
  const logsQuery = logs(tokenId);

  if (tokenQuery.isPending) {
    return <Spinner />;
  }

  if (tokenQuery.isError || !tokenQuery.data) {
    const message = tokenQuery.isError ? (tokenQuery.error as Error).message : 'Token not found';
    return <div role="alert">Failed to load token: {message}</div>;
  }

  return <TokenDetailsView
    token={tokenQuery.data}
    logs={logsQuery.data ?? []}
    logsPending={logsQuery.isPending}
    logsError={logsQuery.isError ? (logsQuery.error as Error).message : undefined}
  />;
}
