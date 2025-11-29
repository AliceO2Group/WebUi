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
  useEffect,
  type FC,
  type PropsWithChildren,
  type Dispatch,
  type SetStateAction,
} from 'react';

export const DEFAULT_DRAWER_WIDTH = 300;
export const MIN_DRAWER_WIDTH = 300;
export const MAX_DRAWER_WIDTH = 800;

interface DrawerContextValue {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  toggleDrawer: () => void;
  drawerWidth: number;
  setDrawerWidth: Dispatch<SetStateAction<number>>;
  isResizing: boolean;
  handleResize: () => void;
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
  const [isResizing, setIsResizing] = useState(false);

  const toggleDrawer = () => {
    setIsOpen((prev) => !prev);
  };

  const handleResize = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) {
        return;
      }

      const newWidth = e.clientX;
      const clampedWidth = Math.max(MIN_DRAWER_WIDTH, Math.min(MAX_DRAWER_WIDTH, newWidth));
      setDrawerWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const value: DrawerContextValue = {
    isOpen,
    setIsOpen,
    toggleDrawer,
    drawerWidth,
    setDrawerWidth,
    isResizing,
    handleResize,
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
