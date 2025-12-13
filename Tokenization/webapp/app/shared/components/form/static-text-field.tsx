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

import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';

export const StaticTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputLabel-root': {
    transition: 'none',
  },
  '& .MuiOutlinedInput-root': {
    transition: 'none',
    '& fieldset': {
      transition: 'none',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.text.primary,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));
