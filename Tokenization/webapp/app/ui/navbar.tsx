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

import { Box, Tabs } from '@mui/material';
import React from 'react';

/**
 * TabsNavbar
 *
 * A reusable component that renders a Material-UI Tabs navigation bar.
 * Allows switching between different sections using tab buttons.
 *
 * @param tabIndex The currently selected tab index.
 * @param setTabIndex Function to update the selected tab index.
 * @param children Tab (@mui/material) components (usually <Tab />) to be rendered inside the navigation bar.
 */
export function TabsNavbar({tabIndex, setTabIndex, children}: {tabIndex: number, setTabIndex: (index: number) => void, children?: React.ReactNode}) {
    
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue)
    }
    
    return  <Box>
                <Tabs
                    value={tabIndex}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    textColor="secondary"
                    indicatorColor="secondary"
                >
                    {children}
                </Tabs>
            </Box>
}