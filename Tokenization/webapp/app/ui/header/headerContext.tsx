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

import { createContext, useContext, useEffect } from 'react';

/**
 * HeaderContext
 *
 * React context providing the setHeaderContent function for updating the header content
 * from any component within the provider tree.
 */
export const HeaderContext = createContext({
  /**
   * Updates headers content
   */
  setHeaderContent: (_: string) => {},
});

/**
 * UseSetHeader
 *
 * Changes content of header
 * @param headerContent new value for context
 */
export const useSetHeader = (headerContent: string) => {
  const { setHeaderContent } = useContext(HeaderContext);

  useEffect(() => {
    setHeaderContent(headerContent);
  }, [setHeaderContent, headerContent]);
};
