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
import { useEffect } from 'react';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import { Controller, useForm } from 'react-hook-form';

import { FormMultiSelectField } from '~/shared/components/form/multi-select-field';
import { StaticTextField } from '~/shared/components/form/styled-text-field';

export type TokenFilterValues = {
  serviceFrom: string[];
  serviceTo: string[];
  issuer: string;
  tokenId: string;
};

export const TOKEN_FILTER_DEFAULTS: TokenFilterValues = {
  serviceFrom: [],
  serviceTo: [],
  issuer: '',
  tokenId: '',
};

type TokenFiltersFormProps = {
  issuers: string[];
  serviceOptions: string[];
  loadingServices?: boolean;
  onFiltersChange: (values: TokenFilterValues) => void;
};

export function TokenFiltersForm({
  issuers,
  serviceOptions,
  loadingServices = false,
  onFiltersChange,
}: TokenFiltersFormProps) {
  const { control, reset, watch, getValues } = useForm<TokenFilterValues>({
    defaultValues: TOKEN_FILTER_DEFAULTS,
  });

  useEffect(() => {
    const subscription = watch((values) => onFiltersChange(values as TokenFilterValues));
    return () => subscription.unsubscribe();
  }, [watch, onFiltersChange]);

  const handleReset = () => {
    reset(TOKEN_FILTER_DEFAULTS, { keepDefaultValues: true });
  };

  const handleApply = () => {
    onFiltersChange(getValues());
  };

  return (
    <FiltersFormLayout onSubmit={(event) => event.preventDefault()}>
      <FiltersField>
        <FormMultiSelectField
          control={control}
          name="serviceFrom"
          label="Service from"
          options={serviceOptions}
          loading={loadingServices}
          placeholder="Select producer services"
        />
      </FiltersField>
      <FiltersField>
        <FormMultiSelectField
          control={control}
          name="serviceTo"
          label="Service to"
          options={serviceOptions}
          loading={loadingServices}
          placeholder="Select consumer services"
        />
      </FiltersField>
      <FiltersField>
        <Controller
          control={control}
          name="issuer"
          render={({ field }) => (
            <StaticTextField
              {...field}
              select
              label="Issuer"
              fullWidth
            >
              <MenuItem value="">All issuers</MenuItem>
              {issuers.map((issuer) => (
                <MenuItem key={issuer} value={issuer}>{issuer}</MenuItem>
              ))}
            </StaticTextField>
          )}
        />
      </FiltersField>
      <FiltersField>
        <Controller
          control={control}
          name="tokenId"
          render={({ field }) => (
            <StaticTextField
              {...field}
              label="Token ID"
              placeholder="e.g. tok_1234"
              fullWidth
            />
          )}
        />
      </FiltersField>
      <FiltersActions>
        <Button type="button" variant="outlined" onClick={handleReset}>
          Reset
        </Button>
        <Button type="button" variant="contained" onClick={handleApply}>
          Apply
        </Button>
      </FiltersActions>
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

const FiltersActions = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  minWidth: 160,
}));
