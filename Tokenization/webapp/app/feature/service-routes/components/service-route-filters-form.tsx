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

import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import type { Control } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { FormMultiSelectField } from '~/shared/components/form/multi-select-field';
import { useRouteServiceOptionsQuery } from '~/feature/service-routes/api/queries';
import { SERVICE_ROUTE_FILTER_DEFAULTS, type ServiceRouteFilterValues } from '~/feature/service-routes/types/service-route-filters';
import { useServiceSelectFilters, type ServiceFilterFieldName } from '~/shared/hooks/useServiceSelectFilters';

const SERVICE_FILTERS: Array<{ name: ServiceFilterFieldName; label: string; placeholder: string }> = [
  { name: 'serviceFrom', label: 'Service from', placeholder: 'Select source services' },
  { name: 'serviceTo', label: 'Service to', placeholder: 'Select destination services' },
];

const SERVICE_FILTER_MIN_CHARS = 2;
const SERVICE_FILTER_DEBOUNCE_MS = 300;

export type ServiceRouteFiltersFormProps = {
  onFiltersChange: (values: ServiceRouteFilterValues) => void;
};

/**
 * Form component for filtering service routes based on source and destination services.
 * Calls onFiltersChange with the current filter values when applied.
 *
 * @param onFiltersChange Callback function invoked with the filter values when the user applies the filters.
 */
export function ServiceRouteFiltersForm({ onFiltersChange }: ServiceRouteFiltersFormProps) {
  const { control, reset, getValues } = useForm<ServiceRouteFilterValues>({
    defaultValues: SERVICE_ROUTE_FILTER_DEFAULTS,
  });

  const handleReset = () => {
    reset(SERVICE_ROUTE_FILTER_DEFAULTS, { keepDefaultValues: true });
  };

  const handleApply = () => {
    onFiltersChange(getValues());
  };

  return (
    <FiltersFormLayout onSubmit={(event) => event.preventDefault()}>
      <ServicesFilters control={control} />

      <FooterRow>
        <FiltersActionsContainer>
          <Button type="button" variant="outlined" onClick={handleReset}>
            Reset
          </Button>
          <Button type="button" variant="contained" onClick={handleApply}>
            Apply
          </Button>
        </FiltersActionsContainer>
      </FooterRow>
    </FiltersFormLayout>
  );
}

type ServicesFiltersProps = {
  control: Control<ServiceRouteFilterValues>;
};

/**
 * Component rendering service selection filters for source and destination services.
 *
 * @param control React Hook Form control object for managing form state
 * - passed down to make multi-select fields controlled.
 */
function ServicesFilters({ control }: ServicesFiltersProps) {
  const {
    searchValues,
    queryByField,
    handleInputValueChange,
  } = useServiceSelectFilters({
    queryHook: useRouteServiceOptionsQuery,
    debounceMs: SERVICE_FILTER_DEBOUNCE_MS,
    minChars: SERVICE_FILTER_MIN_CHARS,
  });

  return (
    <ServicesGrid>
      {SERVICE_FILTERS.map(({ name, label, placeholder }) => {
        const data = queryByField[name].data ?? [];
        const options = data.map((service) => ({ label: service.commonName, value: service.serviceId }));

        return (
          <FiltersField key={name}>
            <FormMultiSelectField
              control={control}
              name={name}
              label={label}
              options={options}
              loading={queryByField[name].isFetching}
              placeholder={placeholder}
              minSearchLength={SERVICE_FILTER_MIN_CHARS}
              inputValue={searchValues[name]}
              onInputValueChange={(value) => handleInputValueChange(name, value)}
            />
          </FiltersField>
        );
      })}
    </ServicesGrid>
  );
}

const FiltersFormLayout = styled('form')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  width: '100%',
  alignItems: 'flex-start',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
  },
}));

const ServicesGrid = styled('div')(({ theme }) => ({
  display: 'grid',
  width: '100%',
  gap: theme.spacing(2),
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
}));

const FooterRow = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'flex-end',
  width: '100%',
}));

const FiltersField = styled('div')(({ theme }) => ({
  flexGrow: 1,
  minWidth: 240,
  width: '100%',
  display: 'flex',
  '& > *': {
    width: '100%',
  },
  [theme.breakpoints.down('sm')]: {
    minWidth: '100%',
  },
}));

const FiltersActionsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  minWidth: 0,
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
}));
