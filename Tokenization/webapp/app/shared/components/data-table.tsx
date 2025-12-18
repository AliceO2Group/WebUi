/**
 * Generic Material UI powered table that accepts arbitrary React nodes for headers
 * and cells, allowing buttons or other interactive controls in either context.
 */
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

import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import type { TableCellProps } from '@mui/material/TableCell';
import { type Key, type ReactNode, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  render: (row: Row, index: number) => ReactNode;
  align?: TableCellProps['align'];
  width?: TableCellProps['width'];
};

export type DataTableProps<Row> = {
  columns: Array<DataTableColumn<Row>>;
  rows: Row[];
  getRowKey?: (row: Row, index: number) => Key;
  emptyState?: ReactNode;
  dense?: boolean;
  bodyMaxHeight?: number | string;
  isLoading?: boolean;
};

/**
 *
 */
export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  emptyState = <Typography color="text.secondary">No data to display.</Typography>,
  dense = false,
  bodyMaxHeight = 360,
  isLoading = false,
}: DataTableProps<Row>) {
  const size: TableCellProps['size'] = dense ? 'small' : 'medium';
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 5,
  });

  const { getVirtualItems, getTotalSize } = rowVirtualizer;
  const virtualItems = getVirtualItems();
  const totalSize = getTotalSize();

  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      ref={parentRef}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        maxHeight: bodyMaxHeight,
        overflowY: 'auto',
      }}
    >
      <Table size={size} stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} align={column.align} width={column.width} sx={{ fontWeight: 600 }}>
                {column.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            <>
              {paddingTop > 0 && (
                <TableRow>
                  <TableCell style={{ height: paddingTop, padding: 0, border: 0 }} colSpan={columns.length} />
                </TableRow>
              )}
              {virtualItems.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <TableRow key={getRowKey?.(row, virtualRow.index) ?? virtualRow.index}>
                    {columns.map((column) => (
                      <TableCell key={column.key} align={column.align}>
                        {column.render(row, virtualRow.index)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
              {paddingBottom > 0 && (
                <TableRow>
                  <TableCell style={{ height: paddingBottom, padding: 0, border: 0 }} colSpan={columns.length} />
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
