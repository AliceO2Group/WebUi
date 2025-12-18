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
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { DataTable, type DataTableColumn } from '~/shared/components/data-table';
import type { ServiceRoute } from '~/feature/service-routes/types/service-route';

export type ServiceRouteTableProps = {
  routes: ServiceRoute[];
  totalCount: number;
  title?: string;
  onBan?: (route: ServiceRoute) => void;
  onBulkBan?: () => void;
  bulkBanDisabled?: boolean;
  tableBodyMaxHeight?: number | string;
  isLoading?: boolean;
};

export function ServiceRouteTable({ routes, totalCount, title = 'Service routes', onBan, onBulkBan, bulkBanDisabled = false, tableBodyMaxHeight, isLoading }: ServiceRouteTableProps) {
  const showActionsColumn = Boolean(onBan);
  const showBulkAction = Boolean(onBulkBan);

  const columns: Array<DataTableColumn<ServiceRoute>> = useMemo(() => {
    const baseColumns: Array<DataTableColumn<ServiceRoute>> = [
      {
        key: 'serviceFrom',
        header: 'Service from',
        render: (route) => <Link to={`/services/${route.serviceFrom.serviceId}`}>{route.serviceFrom.commonName}</Link>
      },
      {
        key: 'serviceTo',
        header: 'Service to',
        render: (route) => <Link to={`/services/${route.serviceTo.serviceId}`}>{route.serviceTo.commonName}</Link>,
      },
      {
        key: 'permissions',
        header: 'Permissions',
        render: (route) => (
          <PermissionsStack direction="row" spacing={1} flexWrap="wrap">
            {route.permissions.map((permission) => (
              <Chip key={`${route.serviceFrom}-${route.serviceTo}-${permission}`} label={permission} size="small" />
            ))}
          </PermissionsStack>
        ),
      },
    ];

    if (showActionsColumn) {
      baseColumns.push({
        key: 'actions',
        header: 'Actions',
        render: (route) => (
          <Button size="small" color="warning" variant="outlined" onClick={() => onBan?.(route)}>
            Ban route
          </Button>
        ),
        align: 'right',
      });
    }

    return baseColumns;
  }, [onBan, showActionsColumn]);

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <BoxedTitle current={routes.length} total={totalCount} title={title} />
        {showBulkAction ? (
          <Button variant="outlined" color="warning" onClick={onBulkBan} disabled={bulkBanDisabled}>
            Bulk ban
          </Button>
        ) : null}
      </Stack>
      <DataTable
        columns={columns}
        rows={routes}
        getRowKey={(route) => route.routeId}
        dense
        bodyMaxHeight={tableBodyMaxHeight}
        isLoading={isLoading}
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

const PermissionsStack = styled(Stack)(({ theme }) => ({
  '& .MuiChip-root': {
    marginBottom: theme.spacing(0.5),
  },
}));
