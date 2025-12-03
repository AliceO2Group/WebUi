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
import { Form } from '~/components/form/Form';
import { ROUTE_PREFIX } from '~/config';
import { Spinner } from '~/ui/spinner';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { DEFAULT_PREFIX } from '~/components/form/constants';
import { getDefaultValuesFromConfigObject } from '~/components/form/utils/getDefaultValuesFromConfigObject';
import { SaveButton } from '~/components/form/components/buttons/SaveButton';

export type InputsType = Record<string, string | number | boolean>;

const ConfigurationPage = () => {
  const { pathname } = useLocation();
  const configurationName = pathname.slice(ROUTE_PREFIX.length);

  const { data: configuration, isLoading: isConfigurationLoading } =
    useConfigurationQuery(configurationName);

  const defaultValues = useMemo(
    () => getDefaultValuesFromConfigObject(configuration),
    [configuration, pathname],
  );

  const { data: configurationRestrictions, isLoading: isConfigurationRestrictionsLoading } =
    useConfigurationRestrictionsQuery(configurationName);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { isDirty },
    reset,
  } = useForm<InputsType>({ defaultValues });

  const onSubmit: SubmitHandler<InputsType> = (data) => {
    // for now only logging the values
    // eslint-disable-next-line no-console
    console.log(data);
    // eslint-disable-next-line no-console
    console.log(getValues());
  };

  useEffect(() => () => reset(defaultValues), [defaultValues]);

  if (isConfigurationLoading || isConfigurationRestrictionsLoading) {
    return <Spinner />;
  }

  if (!configuration || !configurationRestrictions) {
    return 'Error while loading data from the server';
  }


  return (
    <>
      <form>
        <Form
          control={control}
          sectionTitle={DEFAULT_PREFIX}
          sectionPrefix={DEFAULT_PREFIX}
          items={configuration}
          itemsRestrictions={configurationRestrictions}
        />
      </form>
      <SaveButton onClick={() => void handleSubmit(onSubmit)()} disabled={!isDirty} />
    </>
  );
};

export default ConfigurationPage;
