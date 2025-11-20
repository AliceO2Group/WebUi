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
import { Spinner } from '~/ui/spinner';

const ConfigurationPage = () => {
  const { pathname } = useLocation();
  const configurationName = pathname.split('/').pop() as string;

  const { data: configuration, isLoading: isConfigurationLoading } =
    useConfigurationQuery(configurationName);

  const { data: configurationRestrictions, isLoading: isConfigurationRestrictionsLoading } =
    useConfigurationRestrictionsQuery(configurationName);

  if (isConfigurationLoading || isConfigurationRestrictionsLoading) {
    return <Spinner />;
  }

  if (!configuration || !configurationRestrictions) {
    return 'Error while loading data from the server';
  }

  return (
    <Form
      sectionTitle="Configuration"
      items={configuration}
      itemsRestrictions={configurationRestrictions}
    />
  );
};

export default ConfigurationPage;
