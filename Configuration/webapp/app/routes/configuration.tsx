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
import { DEFAULT_PREFIX } from '~/components/form/constants';
import { SaveButton } from '~/components/form/components/buttons/SaveButton';
import { useConfigurationForm } from '~/hooks/useConfigurationForm';
import { UnsavedChangesModal } from '~/components/form/components/UnsavedChangesModal';
import { useUnsavedChangesBlocker } from '~/hooks/useUnsavedChangesBlocker';

export type InputsType = Record<string, string | number | boolean>;

const ConfigurationPage = () => {
  const { pathname } = useLocation();
  const configurationName = pathname.slice(ROUTE_PREFIX.length);

  const { data: configuration, isLoading: isConfigurationLoading } =
    useConfigurationQuery(configurationName);

  const { data: configurationRestrictions, isLoading: isConfigurationRestrictionsLoading } =
    useConfigurationRestrictionsQuery(configurationName);

  const {
    control,
    handleSubmit,
    formState: { isDirty },
    onSubmit,
  } = useConfigurationForm({
    configuration,
    configurationName,
  });

  const { showModal, handleProceed, handleSaveAndProceed, handleCancel } = useUnsavedChangesBlocker(
    {
      isDirty,
      onSave: handleSubmit(onSubmit),
    },
  );

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
          sectionPrefix={pathname}
          items={configuration}
          itemsRestrictions={configurationRestrictions}
        />
      </form>
      <SaveButton onClick={() => void handleSubmit(onSubmit)()} disabled={!isDirty} />
      <UnsavedChangesModal
        open={showModal}
        onProceed={handleProceed}
        onSaveAndProceed={() => void handleSaveAndProceed}
        onCancel={handleCancel}
      />
    </>
  );
};

export default ConfigurationPage;
