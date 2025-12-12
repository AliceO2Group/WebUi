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
import type { TableCellProps } from '@mui/material/TableCell';
import type { Key, ReactNode } from 'react';

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
}: DataTableProps<Row>) {
  const size: TableCellProps['size'] = dense ? 'small' : 'medium';

  return (
    <TableContainer
      component={Paper}
      elevation={0}
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
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow key={getRowKey?.(row, rowIndex) ?? rowIndex}>
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align}>
                    {column.render(row, rowIndex)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
