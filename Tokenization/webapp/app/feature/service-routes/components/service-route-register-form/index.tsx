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
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { IconLoop } from '~/ui/icon';

import { ServiceSelectField } from './ServiceSelectField';
import { PermissionsField } from './PermissionsField';
import { useServiceRouteRegisterForm } from './useServiceRouteRegisterForm';

/**
 * Presents the UI for creating a new service-to-service route.
 */
export function ServiceRouteRegisterForm() {
  const {
    control,
    handleSubmit,
    handleRouteCreateSubmit,
    handleResetCreationForm,
    handleSwapServices,
    serviceFromField,
    serviceToField,
    permissionsOptions,
    isCreateDisabled,
    isRegistering,
    isSwapDisabled,
    minSearchChars,
  } = useServiceRouteRegisterForm();

  return (
    <CreationCard elevation={0}>
      <CreationForm onSubmit={handleSubmit(handleRouteCreateSubmit)}>
        <CreationCardInner>
          <CreationHeader>
            <CreationHeaderText>
              <Typography variant="h6">Register service route</Typography>
              <Typography variant="body2" color="text.secondary">
                Allow one service to reach another by selecting the participants and the permissions they should receive.
              </Typography>
            </CreationHeaderText>
          </CreationHeader>
          <CreationBody spacing={3}>
            <ServiceSelectsLayout>
              <ServiceSelectField
                control={control}
                name="serviceFrom"
                label="Service from"
                placeholder="Select source service"
                options={serviceFromField.options}
                inputValue={serviceFromField.inputValue}
                onInputValueChange={serviceFromField.onInputValueChange}
                isLoading={serviceFromField.isFetching}
                isDisabled={isRegistering}
                minSearchChars={minSearchChars}
              />
              <SwapButtonWrapper>
                <IconButton
                  type="button"
                  color="primary"
                  onClick={handleSwapServices}
                  disabled={isSwapDisabled || isRegistering}
                  aria-label="Swap services"
                >
                  <IconLoop />
                </IconButton>
              </SwapButtonWrapper>
              <ServiceSelectField
                control={control}
                name="serviceTo"
                label="Service to"
                placeholder="Select destination service"
                options={serviceToField.options}
                inputValue={serviceToField.inputValue}
                onInputValueChange={serviceToField.onInputValueChange}
                isLoading={serviceToField.isFetching}
                isDisabled={isRegistering}
                minSearchChars={minSearchChars}
              />
            </ServiceSelectsLayout>
            <PermissionsSection>
              <Typography variant="subtitle2">Allowed permissions</Typography>
              <Typography variant="body2" color="text.secondary">
                Select the HTTP verbs this route should grant to the caller.
              </Typography>
              <PermissionsField control={control} options={permissionsOptions} disabled={isRegistering} />
            </PermissionsSection>
          </CreationBody>
          <CreationFooter>
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={handleResetCreationForm}
              disabled={isRegistering}
            >
              Reset
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={isCreateDisabled}>
              Register route
            </Button>
          </CreationFooter>
        </CreationCardInner>
      </CreationForm>
    </CreationCard>
  );
}

const SectionCard = styled(Paper)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  boxShadow: 'none',
}));

const CreationCard = styled(SectionCard)(() => ({
  minHeight: 620,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}));

const CreationCardInner = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  width: '100%',
  maxWidth: 520,
  margin: '0 auto',
}));

const CreationForm = styled('form')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const CreationHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
}));

const CreationHeaderText = styled('div')(() => ({
  flex: 1,
  minWidth: 240,
}));

const CreationBody = styled(Stack)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const ServiceSelectsLayout = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));

const SwapButtonWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'flex-start',
  padding: theme.spacing(0.5, 0),
}));

const PermissionsSection = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const CreationFooter = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(1),
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
}));
