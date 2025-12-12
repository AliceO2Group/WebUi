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

/**
 * TokenFiltersForm groups all filter controls for the token overview page.
 * It relies on react-hook-form for state management and exposes the current
 * values via the onFiltersChange callback whenever inputs update.
 */
import { useCallback, useState } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { Controller, type Control, useForm } from 'react-hook-form';

import { useTokenServiceOptionsQuery } from '~/feature/token/api/queries';
import { FormMultiSelectField } from '~/shared/components/form/multi-select-field';
import { StaticTextField } from '~/shared/components/form/styled-text-field';
import { OrderingControl, type OrderingOption } from '~/shared/components/order/ordering-control';
import { TOKEN_FILTER_DEFAULTS, type TokenFilterValues } from '~/feature/token/types/token-filters';
import { useDebouncedValue } from '~/shared/hooks/useDebouncedValue';
import { hasDataFilters } from '~/feature/token/services/token-filters.service';
import { useAlert } from '~/shared/hooks/useAlert';

const ORDERING_OPTIONS: OrderingOption[] = [
  { value: 'iat', label: 'Issue date' },
  { value: 'exp', label: 'Expiration date' },
  { value: 'tokenId', label: 'Token ID' },
];

type TokenFiltersFormProps = {
  onFiltersChange: (values: TokenFilterValues) => void;
};

type ServiceFieldName = 'serviceFrom' | 'serviceTo';
type DateFieldName = 'issuedAfter' | 'issuedBefore' | 'expiresAfter' | 'expiresBefore';

const SERVICE_FILTER_MIN_CHARS = 2;
const SERVICE_FILTER_DEBOUNCE_MS = 300;

const SERVICE_FILTERS: Array<{ name: ServiceFieldName; label: string; placeholder: string }> = [
  { name: 'serviceFrom', label: 'Service from', placeholder: 'Service From' },
  { name: 'serviceTo', label: 'Service to', placeholder: 'Service To' },
];

const DATE_FILTERS: Array<{ name: DateFieldName; label: string }> = [
  { name: 'issuedAfter', label: 'Issue date from' },
  { name: 'issuedBefore', label: 'Issue date to' },
  { name: 'expiresAfter', label: 'Expiration from' },
  { name: 'expiresBefore', label: 'Expiration to' },
];

/**
 *
 */
export function TokenFiltersForm({
  onFiltersChange,
}: TokenFiltersFormProps) {
  const { control, reset, getValues } = useForm<TokenFilterValues>({
    defaultValues: TOKEN_FILTER_DEFAULTS,
  });
  const pushAlert = useAlert();

  const handleReset = () => {
    reset(TOKEN_FILTER_DEFAULTS, { keepDefaultValues: true });
  };

  const handleApply = () => {
    const values = getValues();
    const hasOrdering = Boolean(values.ordering && values.ordering.length);
    const hasFilters = hasDataFilters(values);
    if (hasOrdering && !hasFilters) {
      pushAlert({ message: 'Add at least one service or date filter to apply ordering.', severity: 'warning' });
      return;
    }
    onFiltersChange(values);
  };

  return (
    <FiltersFormLayout onSubmit={(event) => event.preventDefault()}>
      <ServicesFilters control={control} />

      <DatesFilters control={control} />

      <FooterRow>
        <OrderingSection control={control} />
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
  control: Control<TokenFilterValues>;
};

/**
 *
 */
function ServicesFilters({ control }: ServicesFiltersProps) {
  const [searchValues, setSearchValues] = useState<Record<ServiceFieldName, string>>({
    serviceFrom: '',
    serviceTo: '',
  });

  const debouncedSearchValues = {
    serviceFrom: useDebouncedValue(searchValues.serviceFrom, SERVICE_FILTER_DEBOUNCE_MS),
    serviceTo: useDebouncedValue(searchValues.serviceTo, SERVICE_FILTER_DEBOUNCE_MS),
  };

  const serviceFromQuery = useTokenServiceOptionsQuery({
    searchTerm: debouncedSearchValues.serviceFrom,
    enabled: debouncedSearchValues.serviceFrom.length >= SERVICE_FILTER_MIN_CHARS,
  });
  const serviceToQuery = useTokenServiceOptionsQuery({
    searchTerm: debouncedSearchValues.serviceTo,
    enabled: debouncedSearchValues.serviceTo.length >= SERVICE_FILTER_MIN_CHARS,
  });

  const queryByField: Record<ServiceFieldName, typeof serviceFromQuery> = {
    serviceFrom: serviceFromQuery,
    serviceTo: serviceToQuery,
  };

  const handleInputValueChange = useCallback((field: ServiceFieldName, value: string) => {
    setSearchValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <ServicesRow>
      {SERVICE_FILTERS.map(({ name, label, placeholder }) => (
        <FiltersField key={name}>
          <FormMultiSelectField
            control={control}
            name={name}
            label={label}
            options={queryByField[name].data ?? []}
            loading={queryByField[name].isFetching}
            placeholder={placeholder}
            minSearchLength={SERVICE_FILTER_MIN_CHARS}
            inputValue={searchValues[name]}
            onInputValueChange={(value) => handleInputValueChange(name, value)}
          />
        </FiltersField>
      ))}
    </ServicesRow>
  );
}

type DatesFiltersProps = {
  control: Control<TokenFilterValues>;
};

/**
 *
 */
function DatesFilters({ control }: DatesFiltersProps) {
  return (
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
  );
}

type OrderingSectionProps = {
  control: Control<TokenFilterValues>;
};

/**
 *
 */
function OrderingSection({ control }: OrderingSectionProps) {
  return (
    <OrderingField>
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
    </OrderingField>
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

const ServicesRow = styled('div')(({ theme }) => ({
  display: 'grid',
  width: '100%',
  gap: theme.spacing(2),
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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

const OrderingField = styled('div')(({ theme }) => ({
  width: '100%',
  minWidth: 0,
  display: 'flex',
  '& > *': {
    width: '100%',
  },
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
