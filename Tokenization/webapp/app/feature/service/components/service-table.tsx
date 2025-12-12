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

import { useMemo } from 'react';
import { Link } from 'react-router';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DataTable, type DataTableColumn } from '~/shared/components/data-table';
import type { Service } from '~/feature/service/types/service';

export type ServicesTableProps = {
  services: Service[];
  totalCount: number;
  title?: string;
  onBlock?: (service: Service) => void;
  onBulkBlock?: () => void;
  bulkBlockDisabled?: boolean;
  tableBodyMaxHeight?: number | string;
};

export function ServicesTable({ services, totalCount, title = 'Services', onBlock, onBulkBlock, bulkBlockDisabled = false, tableBodyMaxHeight }: ServicesTableProps) {
  const showActionsColumn = Boolean(onBlock);
  const showBulkAction = Boolean(onBulkBlock);

  const columns: Array<DataTableColumn<Service>> = useMemo(() => {
    const baseColumns: Array<DataTableColumn<Service>> = [
      {
        key: 'serviceId',
        header: 'Service ID',
        render: (service) => (
          <Button component={Link} to={`/services/${service.serviceId}`} variant="text" size="small">
            {service.serviceId}
          </Button>
        ),
      },
      {
        key: 'commonName',
        header: 'Common name',
        render: (service) => service.commonName,
      },
      {
        key: 'iat',
        header: 'Issued at',
        render: (service) => new Date(service.iat).toLocaleString(),
      },
      {
        key: 'exp',
        header: 'Expires',
        render: (service) => new Date(service.exp).toLocaleString(),
      },
    ];

    if (showActionsColumn) {
      baseColumns.push({
        key: 'actions',
        header: 'Actions',
        render: (service) => (
          <Button size="small" color="warning" variant="outlined" onClick={() => onBlock?.(service)}>
            Block
          </Button>
        ),
        align: 'right',
      });
    }

    return baseColumns;
  }, [showActionsColumn, onBlock]);

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <BoxedTitle current={services.length} total={totalCount} title={title} />
        {showBulkAction ? (
          <Button variant="outlined" color="warning" onClick={onBulkBlock} disabled={bulkBlockDisabled}>
            Bulk block
          </Button>
        ) : null}
      </Stack>
      <DataTable
        columns={columns}
        rows={services}
        getRowKey={(service) => service.serviceId}
        dense
        bodyMaxHeight={tableBodyMaxHeight}
      />
    </Paper>
  );
}

type BoxedTitleProps = {
  current: number;
  total: number;
  title: string;
};

const BoxedTitle = ({ current, total, title }: BoxedTitleProps) => (
  <Stack>
    <Typography variant="h6">{title}</Typography>
    <Typography variant="body2" color="text.secondary">
      Showing {current} of {total} items
    </Typography>
  </Stack>
);
