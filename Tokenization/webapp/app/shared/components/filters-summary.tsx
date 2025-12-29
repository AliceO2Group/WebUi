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

import type { OptionType } from './form/multi-select-field';
import type { OrderingRule } from './order/ordering-control';

interface FiltersSummaryProps {
  serviceFrom?: OptionType[];
  serviceTo?: OptionType[];
  issuedBefore?: string;
  issuedAfter?: string;
  expiresBefore?: string;
  expiresAfter?: string;
  ordering?: OrderingRule[];
}

const FiltersNames = {
  serviceFrom: 'Service from',
  serviceTo: 'Service to',
  issuedBefore: 'Issued before',
  issuedAfter: 'Issued after',
  expiresBefore: 'Expires before',
  expiresAfter: 'Expires after',
};

/**
 * Renders a summary of the currently applied filters.
 * If no filters are applied, a corresponding message is shown.
 *
 * @param filters The filters to summarize.
 */
export default function FiltersSummary({ filters }: { filters: FiltersSummaryProps | null }) {
  if (!filters) {
    return <span>No filters applied.</span>;
  }

  const asNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
  const asNonEmptyOptions = (value: unknown): value is OptionType[] => Array.isArray(value) && value.length > 0;

  const elements = Object.entries(filters).reduce<[string, string][]>((acc, [key, value]) => {
    if (key === 'ordering' || value === undefined || value === null) {
      return acc;
    }

    if ((key === 'serviceFrom' || key === 'serviceTo') && asNonEmptyOptions(value)) {
      const labels = value
        .map(({ label }) => label)
        .filter(Boolean)
        .join(', ');

      if (labels) {
        acc.push([FiltersNames[key as keyof typeof FiltersNames], labels]);
      }

      return acc;
    }

    if (asNonEmptyString(value)) {
      const date = new Date(value);
      acc.push([key, Number.isNaN(date.getTime()) ? value : date.toLocaleString()]);
    }

    return acc;
  }, []);

  if (!elements.length) {
    return <span>No filters applied.</span>;
  }

  return <>
    {
      elements.map(([key, value]) => {
        if (!value) {
          return null;
        }
        return (
          <div key={key}>
            <strong>{key}:</strong> {value}
          </div>
        );
      })
    }
  </>;

}
