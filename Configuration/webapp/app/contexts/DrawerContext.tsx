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

import {
  createContext,
  useContext,
  useState,
  type FC,
  type PropsWithChildren,
  type Dispatch,
  type SetStateAction,
} from 'react';

export const DEFAULT_DRAWER_WIDTH = 300;

interface DrawerContextValue {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  toggleDrawer: () => void;
  drawerWidth: number;
}

const DrawerContext = createContext<DrawerContextValue | undefined>(undefined);

/**
 * DrawerProvider component
 * Provides drawer state management to child components.
 * @param {PropsWithChildren} props - Component props.
 * @param {React.ReactNode} props.children - The children elements to render.
 * @returns {React.ReactElement} DrawerProvider
 */
export const DrawerProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH);

  const toggleDrawer = () => {
    setIsOpen((prev) => !prev);
  };

  const value: DrawerContextValue = {
    isOpen,
    setIsOpen,
    toggleDrawer,
    drawerWidth,
  };

  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
};

/**
 * useDrawer hook
 * Custom hook to access drawer context.
 * @throws {Error} If used outside of DrawerProvider
 * @returns {DrawerContextValue} Drawer context value
 */
export const useDrawer = (): DrawerContextValue => {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
};
