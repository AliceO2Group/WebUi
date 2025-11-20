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

import { List, ListItem, Skeleton } from '@mui/material';

const ITEMS_TO_RENDER_COUNT = 15;

export const ConfigNavigatorLoader = () => (
  <List className="config_navigator__loader">
    {Array.from({ length: ITEMS_TO_RENDER_COUNT }).map((_, index) => (
      <ListItem
        style={{ paddingTop: 5, paddingBottom: 5 }}
        className="config_navigator__item"
        key={`loader-${index}`}
      >
        <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 2 }}/>
      </ListItem>
    ))}
  </List>
);
