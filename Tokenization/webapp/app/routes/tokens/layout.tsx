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

import { Outlet, useNavigation } from 'react-router';

import { Spinner } from '~/ui/spinner';
import { useSetHeader } from '~/ui/header/headerContext';
import { TabsNavbar, LinkTab } from '~/ui/navbar';

/**
 * Layout for tokens subpage
 */
export default function TokenLayout() {

  const { state }  = useNavigation();

  useSetHeader('Tokens');

  return (
    <div>
      <TabsNavbar >
        <LinkTab label="List of tokens" to=""/>
        <LinkTab label="Create token" to="new"/>
      </TabsNavbar>

      {state === 'loading' ? <Spinner /> : <Outlet/>}
    </div> );
}
