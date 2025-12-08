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

import React from 'react';
import { FlexGrowWrapper } from '~/ui/flex';

type FilterType = {
  id: string;
  label: string;
  value: any;
  setValue: (value: any) => void;
  options: { value: string; label: string }[] | null;
  render: React.ComponentType<any>;
};

/**
 *
 */
export default function FilterRow({ filterRowData }: { filterRowData: FilterType[] }) {
  return (
    <FlexGrowWrapper>
      {filterRowData.map((filterData: FilterType, i: number) => {
        // If options are provided, pass them to the render component
        let props;
        const { id, label: labelText, value, setValue, options } = filterData;
        if (options) {
          props = {
            id,
            label: labelText,
            value,
            setValue,
            options,
          };
        } else {
          props = {
            id,
            labelText,
            value,
            setValue,
          };
        }
        return React.createElement(filterData.render, { key: i, ...props });
      })
      }
    </FlexGrowWrapper>
  );
}
