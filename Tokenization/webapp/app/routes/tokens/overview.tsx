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

import type { Token } from '../../components/tokens/token';
import type { Route } from './+types/overview';
import {Link} from 'react-router';

export const clientLoader = async (): Promise<Token[]> => {
    const response = await fetch('http://localhost:8080/api/tokens');
    if (!response.ok) {
        throw new Error('An error occurred!');
    }
    return response.json();
}

export default function Overview({loaderData: tokens}: Route.ComponentProps) {
    return <>
        <h1>Tokens</h1>
        <table className={'table'}>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>validity</th>
                </tr>
            </thead>
            <tbody>
            {tokens.map((token: Token) => <tr key={token.tokenId}>
                <td><Link to={`/tokens/${token.tokenId}`}>{token.tokenId}</Link></td>
                <td className={token.validity === 'bad' ? 'danger' : ''}>{token.validity}</td>
            </tr>)}
            </tbody>
        </table>
    </>
}
