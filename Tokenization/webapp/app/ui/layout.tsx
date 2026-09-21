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
import { useState } from 'react';

import { AppHeader } from './header/header';
import { HeaderContext } from './header/headerContext';
import { AppSidebar } from './sidebar';
import { Spinner } from './spinner';

/**
 * Component provides main layout for the application
 * Uses useNavigation state to check if page is loaded
 */
export default function Layout() {
  const { state }  = useNavigation();

  const [headerContent, setHeaderContent] = useState<string>('Tokenization Admin Interface');

  return (
    <HeaderContext.Provider value={{ setHeaderContent }}>
      <div className='container'>
        <AppHeader headerContent={headerContent}/>
        <AppSidebar />
        <div id="content" className="bg-gray" style={{ gridRow: 'span 2', width: '95.3%' }}>
          {state === 'loading' ? <Spinner /> : <Outlet/>}
        </div>
      </div>
    </HeaderContext.Provider>
  );

}
