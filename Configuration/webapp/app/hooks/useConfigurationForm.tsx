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

import { useEffect, useMemo } from 'react';
import type { InputsType } from '~/routes/configuration';
import { useForm, type KeepStateOptions, type SubmitHandler } from 'react-hook-form';
import { getDefaultValuesFromConfigObject } from '~/components/form/utils/getDefaultValuesFromConfigObject';
import { useLocation } from 'react-router';
import type { FormValue } from '~/components/form/types';

const RESET_PROPS: KeepStateOptions = { keepDirty: false };

/**
 * useConfigurationForm hook
 * Provides form state management to child components.
 * @param {FormItem | undefined} configuration - The configuration object.
 * @returns {FormContextValue} Form context value
 */
export const useConfigurationForm = ({
  configuration,
}: {
  configuration: FormValue | undefined;
}) => {
  const { pathname } = useLocation();

  const defaultValues = useMemo(
    () => getDefaultValuesFromConfigObject(configuration, pathname),
    [configuration, pathname],
  );

  const { control, handleSubmit, getValues, formState, reset } = useForm<InputsType>({
    defaultValues,
  });

  const onSubmit: SubmitHandler<InputsType> = (data) => {
    // for now only logging the values
    // eslint-disable-next-line no-console
    console.log(data);
    // eslint-disable-next-line no-console
    console.log(getValues());
  };

  useEffect(() => reset(defaultValues, RESET_PROPS), [defaultValues]);

  return {
    control,
    handleSubmit,
    getValues,
    formState,
    reset,
    onSubmit,
  };
};
