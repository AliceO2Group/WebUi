/**
 * Generic Material UI powered table that accepts arbitrary React nodes for headers
 * and cells, allowing buttons or other interactive controls in either context.
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
};

export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  emptyState = <Typography color="text.secondary">Brak danych do wyświetlenia.</Typography>,
  dense = false,
}: DataTableProps<Row>) {
  const size: TableCellProps['size'] = dense ? 'small' : 'medium';

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <Table size={size}>
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
