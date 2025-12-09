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

interface TypeWithId {
  id: string;
}

interface Column<T> {
  key: string;
  label: string | (() => React.ReactNode);
  render?: (t: T) => React.ReactNode | undefined;
}

/**
 * TableBase component to use for other tables to implement generic table appearance.
 *
 * @param {object} props - component props
 * @param {T[]} props.data - array of data records to display
 * @param {Column<T>[]} props.columns - column definitions
 *
 * Notes:
 * - This component only renders the table.
 * - To be more reusable uses any and expects data items to have correct keys.
 * - Type T needs to present id field for keying rows.
 */
export function TableBase<T extends TypeWithId>({
  data,
  columns,
}: {
  data: (T & { className?: string })[];
  columns: Column<T>[];
}) {

  return (
    <div className="scroll-auto">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>
                {typeof c.label === 'function'
                  ? c.label()
                  : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item: T & { className?: string }) => (
            <tr key={item.id} className={item.className ?? ''}>
              {columns.map((col: Column<T>) => (
                <td key={col.key}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
