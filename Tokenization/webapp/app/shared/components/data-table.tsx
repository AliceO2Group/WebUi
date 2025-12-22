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
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { Spinner } from '~/ui/spinner';

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
 * Data table component with virtualized rows for performance with large datasets.
 * 
 * @param columns Column definitions.
 * @param rows Data rows.
 * @param getRowKey Optional function to get a unique key for each row.
 * @param emptyState Content to display when there are no rows.
 * @param dense Whether to use dense padding.
 * @param bodyMaxHeight Maximum height of the table body.
 * @param isLoading Whether the table is in a loading state.
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
        <TableHeader<Row> columns={columns} />
        <TableBodyVirtualized<Row>
          rows={rows}
          columns={columns}
          paddingTop={paddingTop}
          paddingBottom={paddingBottom}
          virtualItems={virtualItems as VirtualItem[]}
          isLoading={isLoading ?? false}
          emptyState={emptyState}
          getRowKey={getRowKey}
        />
      </Table>
    </TableContainer>
  );
}

/**
 * Table header component.
 * 
 * @param columns Columns to render in the header.
 */
function TableHeader<Row>({columns}: {columns: Array<DataTableColumn<Row>>}) {
  return <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} align={column.align} width={column.width} sx={{ fontWeight: 600 }}>
                {column.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
}

/**
 * Table body with virtualized rows.
 * 
 * @param rows Data rows.
 * @param columns Column definitions.
 * @param paddingTop Padding to apply at the top of the table body - needed for scroll to work properly with virtualization
 * @param paddingBottom Padding to apply at the bottom of the table body - needed for scroll to work properly with virtualization
 * @param virtualItems Virtualized items to render.
 * @param isLoading Whether the table is in a loading state.
 * @param emptyState Content to display when there are no rows.
 * @param getRowKey Optional function to get a unique key for each row.
 *  
 */
function TableBodyVirtualized<Row>({
  rows, 
  columns,
  paddingTop,
  paddingBottom,
  virtualItems,
  isLoading,
  emptyState,
  getRowKey,
}: {
    rows: Row[]; 
    columns: Array<DataTableColumn<Row>>
    paddingTop: number;
    paddingBottom: number;
    virtualItems: VirtualItem[];
    isLoading: boolean;
    emptyState: ReactNode;
    getRowKey?: (row: Row, index: number) => Key;
}) {

  if(isLoading) {
    return <TableBody>
        <LoadingTableBody columnsLength={columns.length} /> 
      </TableBody> 
  }

  if(rows.length === 0) {
    return <TableBody>
        <EmptyTableBody columnsLength={columns.length} content={emptyState} />
      </TableBody> 
  }

  return <TableBody>
          <VirtualTablePagination padding={paddingTop} columnsLength={columns.length} />
          {     
            virtualItems.map((virtualRow) => {
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
            }) 
          }
          <VirtualTablePagination padding={paddingBottom} columnsLength={columns.length} />
        </TableBody>
}

/**
 * Virtual table pagination row for scroll to work properly
 * 
 * @param padding height of the padding row needed
 * @param columnsLength number of columns in the table
 */
function VirtualTablePagination({
  padding,
  columnsLength
}: {
  padding: number;
  columnsLength: number;
}) {
  
  if(padding <= 0) {
    return null;
  }

  return <TableRow>
          <TableCell style={{ height: padding, padding: 0, border: 0 }} colSpan={columnsLength} />
         </TableRow>

}

/**
 * Loading table body component.
 * 
 * @param columnsLength number of columns in the table
 * @returns 
 */
function LoadingTableBody({columnsLength}: {columnsLength: number}) {
  return <TableRow>
          <TableCell colSpan={columnsLength}>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Spinner />
            </Box>
          </TableCell>
        </TableRow>
}

/**
 * Empty table body component.
 * 
 * @param columnsLength number of columns in the table
 * @param content content to display in the empty state
 */
function EmptyTableBody({columnsLength, content}: {columnsLength: number; content: ReactNode}) {
  return <TableRow>
          <TableCell colSpan={columnsLength}>
            {content}
          </TableCell>
        </TableRow>
}