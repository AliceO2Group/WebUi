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
import { Controller, useForm } from 'react-hook-form';

import { StaticTextField } from '~/shared/components/form/static-text-field';
import { OrderingControl, type OrderingOption } from '~/shared/components/order/ordering-control';
import { SERVICE_FILTER_DEFAULTS, type ServiceFilterValues } from '~/feature/service/types/service-filters';

const ORDERING_OPTIONS: OrderingOption[] = [
  { value: 'iat', label: 'Issue date' },
  { value: 'exp', label: 'Expiration date' },
  { value: 'commonName', label: 'Service name' },
];

type DateFilterName = keyof Pick<ServiceFilterValues, 'issuedAfter' | 'issuedBefore' | 'expiresAfter' | 'expiresBefore'>;

const DATE_FILTERS: Array<{ name: DateFilterName; label: string }> = [
  { name: 'issuedAfter', label: 'Issue date from' },
  { name: 'issuedBefore', label: 'Issue date to' },
  { name: 'expiresAfter', label: 'Expiration from' },
  { name: 'expiresBefore', label: 'Expiration to' },
];

type ServiceFiltersFormProps = {
  onFiltersChange: (values: ServiceFilterValues) => void;
};

/**
 * Form component for filtering services based on various criteria.
 * Calls onFiltersChange with the current filter values when applied.
 *
 * @param onFiltersChange Callback function invoked with the filter values when the user applies the filters.
 */
export function ServiceFiltersForm({ onFiltersChange }: ServiceFiltersFormProps) {
  const { control, reset, getValues } = useForm<ServiceFilterValues>({
    defaultValues: SERVICE_FILTER_DEFAULTS,
  });

  const handleReset = () => {
    reset(SERVICE_FILTER_DEFAULTS, { keepDefaultValues: true });
  };

  const handleApply = () => {
    onFiltersChange(getValues());
  };

  return (
    <FiltersFormLayout onSubmit={(event) => event.preventDefault()}>
      <FiltersField>
        <Controller
          control={control}
          name="search"
          render={({ field }) => (
            <StaticTextField
              {...field}
              type="text"
              label="Search by name"
              placeholder="Service common name"
              fullWidth
            />
          )}
        />
      </FiltersField>

      <DatesGrid>
        {DATE_FILTERS.map(({ name, label }) => (
          <FiltersField key={name}>
            <Controller
              control={control}
              name={name}
              render={({ field }) => (
                <StaticTextField
                  {...field}
                  type="datetime-local"
                  label={label}
                  fullWidth
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                />
              )}
            />
          </FiltersField>
        ))}
      </DatesGrid>

      <FooterRow>
        <FiltersField>
          <Controller
            control={control}
            name="ordering"
            render={({ field }) => (
              <OrderingControl
                label="Ordering"
                options={ORDERING_OPTIONS}
                value={field.value ?? []}
                onChange={field.onChange}
              />
            )}
          />
        </FiltersField>
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

const DatesGrid = styled('div')(({ theme }) => ({
  display: 'grid',
  width: '100%',
  gap: theme.spacing(2),
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
}));

const FooterRow = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: theme.spacing(2),
  width: '100%',
  alignItems: 'flex-start',
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
