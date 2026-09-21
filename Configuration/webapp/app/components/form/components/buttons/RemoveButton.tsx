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

import { IconButton, type IconButtonProps } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

/**
 * Remove button component.
 * @param {IconButtonProps} props - The props of the icon button.
 * @param {() => void} props.onClick - The callback to click the remove button.
 * @returns {ReactElement} The remove button component.
 */
export const RemoveButton = (props: IconButtonProps) => (
  <IconButton color="primary" {...props}>
    <CancelIcon />
  </IconButton>
);
