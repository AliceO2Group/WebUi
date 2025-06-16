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
import { useState } from 'react';
import {Box, Tabs, Tab} from '@mui/material';

import { useSetHeader } from '~/ui/header/headerContext';

import { TabsNavbar } from '~/ui/navbar'

export const clientLoader = async (): Promise<Token[]> => {
    const response = await fetch('http://localhost:8080/api/tokens');
    if (!response.ok) {
        throw new Error('An error occurred!');
    }
    return response.json();
}

// Will be changed in next PR
function TokenTable({tokens}: {tokens: Token[]}) {
    return  <table className={'table'}>
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
}

export default function Overview({loaderData: tokens}: Route.ComponentProps) {
    
    const { setHeaderContent } = useSetHeader()
    setHeaderContent('Tokens')

    const [ tabIndex, setTabIndex ] = useState<number>(0)

    return  <div>
                <TabsNavbar tabIndex={tabIndex} setTabIndex={setTabIndex}>
                    <Tab label="List of tokens" />
                    <Tab label="Create token" />
                </TabsNavbar>

                {   
                    tabIndex == 0 ? 
                    <TokenTable tokens={tokens} /> : 
                    <div className="p-4">
                        <h2 className="text-2xl font-bold mb-4">Create Token</h2>
                        <p>Form to create a new token will go here.</p>
                    </div>
                }
            </div>
}
