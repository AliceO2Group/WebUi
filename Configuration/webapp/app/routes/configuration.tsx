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

import { useLocation } from 'react-router';
import { useConfigurationQuery } from '~/api/query/useConfigurationQuery';
import { useConfigurationRestrictionsQuery } from '~/api/query/useConfigurationRestrictionsQuery';
import { Form, type FormItem } from '~/components/form/Form';
import { Spinner } from '~/ui/spinner';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useMemo } from 'react';

export type InputsType = Record<string, string | number | boolean>;

export const KEY_SEPARATOR = '__';
const DEFAULT_PREFIX = 'Configuration';
const getDefaultValues = (obj: FormItem | undefined, prefix: string = DEFAULT_PREFIX) => {
  if (!obj) {
    return {};
  }
  let result: Record<string, string | number | boolean> = {};
  const entries = Object.entries(obj);
  for (const [key, value] of entries) {
    // omit arrays for now
    if (!isNaN(parseInt(key, 10))) {
      continue;
    }
    const newPrefix = `${prefix}${KEY_SEPARATOR}${key}`;
    if (typeof value === 'object') {
      result = { ...result, ...getDefaultValues(value as FormItem, newPrefix) };
    } else {
      result[newPrefix] = value;
    }
  }
  return result;
};

const ConfigurationPage = () => {
  const { pathname } = useLocation();
  const configurationName = pathname.split('/').pop() as string;

  const { data: configuration, isLoading: isConfigurationLoading } =
    useConfigurationQuery(configurationName);

  const defaultValues = useMemo(() => getDefaultValues(configuration), [configuration]);

  const { data: configurationRestrictions, isLoading: isConfigurationRestrictionsLoading } =
    useConfigurationRestrictionsQuery(configurationName);

  const {
    control,
    handleSubmit,
    getValues,
  } = useForm<InputsType>({ defaultValues });

  const onSubmit: SubmitHandler<InputsType> = async (data) => {
    console.log(data);
    console.log(getValues());
  };

  if (isConfigurationLoading || isConfigurationRestrictionsLoading) {
    return <Spinner />;
  }

  if (!configuration || !configurationRestrictions) {
    return 'Error while loading data from the server';
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Form
          control={control}
          sectionTitle={DEFAULT_PREFIX}
          items={configuration}
          itemsRestrictions={configurationRestrictions}
        />
      </form>
      <button onClick={onSubmit} type="submit">
        Test it now!
      </button>
      <h1>Errors</h1>
    </>
  );
};

export default ConfigurationPage;
