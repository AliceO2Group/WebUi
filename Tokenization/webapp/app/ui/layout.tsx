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

/**
 * Layout
 *
 * Main layout component for the application.
 * Provides the header, sidebar, and main content area.
 * Also sets up the HeaderContext to allow child components to update the header content.
 * @param state The current loading state of the application (e.g., 'loading' or ready).
 * @param children The main content to be rendered inside the layout.
 * @return The application layout with header, sidebar, and content area.
 */

import { useState } from 'react';

import { AppHeader } from './header/header';
import { HeaderContext } from './header/headerContext';
import { AppSidebar } from './sidebar';
import { Spinner } from './spinner';

interface LayoutArgs {
  state: string;
  children: React.ReactNode;
}

/**
 * Component provides layout for the applicatio
 *
 * @param state - refers to state of the whole website if data are loaded its - loading
 * @param children - elements to render inside layout component
 */
export default function Layout({ state, children }: LayoutArgs) {

  const [headerContent, setHeaderContent] = useState<string>('Tokenization Admin Interface');

  return (
    <HeaderContext.Provider value={{ setHeaderContent }}>
      <div className='container'>
        <AppHeader headerContent={headerContent}/>
        <AppSidebar />
        <div id="content" className="bg-gray" style={{ gridRow: 'span 2', width: '95.3%' }}>
          {state === 'loading' ? <Spinner /> : children}
        </div>
      </div>
    </HeaderContext.Provider>
  );

}
