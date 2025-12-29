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

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { styled } from '@mui/material/styles';

type InfoItemProps = {
  label: string;
  value: string;
};

/**
 *
 */
export default function DataGrid({ info }: { info: InfoItemProps[] }) {
  return <DetailsGrid>
    {info.map((item) => (
      <InfoItem key={item.label} label={item.label} value={item.value} />
    ))}
  </DetailsGrid>;
}

const DetailsGrid = styled('div')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2),
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}));

const InfoItem = ({ label, value }: InfoItemProps) => (
  <Stack spacing={0.5}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1">{value}</Typography>
  </Stack>
);
