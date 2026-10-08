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
import { convertFormValuesToConfigObject } from '~/components/form/utils/convertFormValuesToConfigObject';
import { useLocation } from 'react-router';
import type { FormValue, Restrictions } from '~/components/form/types';
import { useConfigurationMutation } from '~/api/mutations/useConfigurationMutation';

const RESET_PROPS: KeepStateOptions = { keepDirty: false };

/**
 * useConfigurationForm hook
 * Provides form state management to child components.
 * @param {object} options - The options for the form.
 * @param {FormItem | undefined} options.configuration - The configuration object.
 * @param {string} options.configurationName - The name of the configuration.
 * @returns {FormContextValue} Form context value
 */
export const useConfigurationForm = ({
  configuration,
  configurationName,
  configurationRestrictions,
}: {
  configuration: FormValue | undefined;
  configurationName: string;
  configurationRestrictions: Restrictions | undefined;
}) => {
  const { pathname } = useLocation();
  const mutation = useConfigurationMutation(configurationName);

  const defaultValues = useMemo(
    () => getDefaultValuesFromConfigObject(configuration, pathname),
    [configuration, pathname],
  );

  const { control, handleSubmit, getValues, formState, reset } = useForm<InputsType>({
    defaultValues,
  });

  const onSubmit: SubmitHandler<InputsType> = (data) => {
    const configurationData = convertFormValuesToConfigObject(
      data,
      configurationRestrictions,
      pathname,
    );
    mutation.mutate(configurationData);
  };

  useEffect(() => reset(defaultValues, RESET_PROPS), [defaultValues, reset]);

  return {
    control,
    handleSubmit,
    getValues,
    formState,
    reset,
    onSubmit,
  };
};
