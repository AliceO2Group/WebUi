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

import type {Route} from './+types/details';
import type {Token} from '../../components/tokens/token';
import {Await, data, Link} from 'react-router';
import {Suspense} from 'react';
import type {Log} from '~/components/logs/log';
import {TokenLogs} from '~/components/tokens/token-logs';
import {Spinner} from '~/ui/spinner';

const getToken = async (tokenId: number): Promise<Token> => {
    const response = await fetch(`http://localhost:8080/api/tokens/${tokenId}`);
    if (!response.ok) {
        throw data(`Failed to fetch token with token id ${tokenId}`, {status: response.status});
    }
    return response.json();
}

const getLogs = async (tokenId: number): Promise<Log[]> => {
    const response = await fetch(`http://localhost:8080/api/tokens/${tokenId}/logs`);
    if (!response.ok) {
        throw data(`Failed to fetch logs related to token with token id ${tokenId}`, {status: response.status});
    }
    return response.json();
}

export const clientLoader = async ({params}: Route.ClientLoaderArgs): Promise<{ token: Token, logs: Promise<Log[]> }> => {
    // Normally we would check that run number is a number...
    const tokenId = parseInt(params.tokenId, 10);

    const logs = getLogs(tokenId);
    const token = await getToken(tokenId);

    return {token, logs};
}

export default function Details({loaderData: {token, logs}}: Route.ComponentProps) {
    return <>
        <h1>Token {token.tokenId} details</h1>
        <p>The token has a {token.validity} validity.</p>
        <h2>Logs</h2>
        <Suspense fallback={<Spinner size={2} align={'left'} />}>
            <Await resolve={logs} errorElement={<div><em>Failed to load the logs</em></div>}>
                {(logs) => <TokenLogs logs={logs} />}
            </Await>
        </Suspense>
        <Link to={'/tokens'}>Back to overview</Link>
    </>;
}
