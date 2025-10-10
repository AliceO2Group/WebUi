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

import { useNavigate } from 'react-router';
import Select, { type MultiValue, type SingleValue } from 'react-select';
import { useState, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
} from '@mui/material';

import type { OptionType, HttpMethod } from '~/utils/types';
import { DangerAlert } from '~/ui/alert';
import { CreationTokenDialog } from '~/ui/dialog';
import { useAuth } from '~/hooks/session';

// eslint-disable-next-line jsdoc/require-jsdoc
export function clientLoader(): OptionType[] {
  return [
    { value: 'service1', label: 'Service 1' },
    { value: 'service2', label: 'Service 2' },
    { value: 'service3', label: 'Service 3' },
    { value: 'service4', label: 'Service 4' },
  ];
}

// HTTP Method options
const httpMethodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
];

/**
 * FormCreationInput
 *
 * Container component for form inputs in the token creation form.
 *
 * @param props.children element input/select/itp.
 * @param props.labelText  Optional label text to display above the input field.
 */
function FormCreationInput({ children, labelText }: { children: React.ReactNode; labelText?: string }) {
  return <div style={{ marginBottom: '20px' }}>
    <label>{labelText}</label>
    {children}
  </div>;
}

interface FormCreationSelectInputProps {
  id: string;
  labelText?: string;
  options: OptionType[];
  value: MultiValue<OptionType> | SingleValue<OptionType>;
  onChange: (value: MultiValue<OptionType> | SingleValue<OptionType>) => void;
  placeholder: string;
  isMulti?: boolean;
}

/**
 * FormCreationSelectInput
 *
 * Container component for select inputs in the token creation form.
 *
 * @param props.id The id of the select input.
 * @param props.labelText Optional label text to display above the select field.
 * @param props.options The options to display in the select dropdown.
 * @param props.value The currently selected value(s).
 * @param props.onChange Callback function to handle changes in selection.
 * @param props.placeholder Placeholder text for the select input.
 * @param props.isMulti Boolean indicating if multiple selections are allowed.
 */
function FormCreationSelectInput(props: FormCreationSelectInputProps) {
  const { labelText, ...rest } = props;

  return <FormCreationInput labelText={labelText}>
    <Select
      {...rest}
    />
  </FormCreationInput>;
}

// eslint-disable-next-line jsdoc/require-jsdoc
export default function CreateToken({ loaderData }: { loaderData?: OptionType[] }) {
  const navigate = useNavigate();
  const [expirationTime, setExpirationTime] = useState<string>('');
  const [firstSelectedService, setFirstSelectedService] = useState<string>('');
  const [secondSelectedService, setSecondSelectedService] = useState<string>('');
  const [selectedMethods, setSelectedMethods] = useState<HttpMethod[]>([]);

  const [showDialogWindow, setShowDialogWindow] = useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const options: OptionType[] = loaderData ?? clientLoader();

  const auth = useAuth('admin');

  const resetForm = useCallback(() => {
    setExpirationTime('');
    setFirstSelectedService('');
    setSecondSelectedService('');
    setSelectedMethods([]);
  }, []);

  const handleCreateToken = useCallback(() => {
    if (auth) {
      // eslint-disable-next-line no-console
      console.log('Creating token...', {
        first: firstSelectedService,
        second: secondSelectedService,
        expiration: expirationTime,
        permissions: selectedMethods,
      });
    } else {
      setSnackbarMessage('Authorization error');
      setOpenSnackbar(true);
    }

    resetForm();
    setShowDialogWindow(false);
  }, [auth, firstSelectedService, secondSelectedService, expirationTime, selectedMethods, resetForm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstSelectedService && secondSelectedService && expirationTime && selectedMethods.length > 0) {
      setShowDialogWindow(true);
    } else {
      let message = 'Please fill in all required fields: ';
      if (!firstSelectedService) {
        message += 'First service, ';
      }
      if (!secondSelectedService) {
        message += 'Second service, ';
      }
      if (!expirationTime) {
        message += 'Expiration time, ';
      }
      if (selectedMethods.length == 0) {
        message += 'HTTP methods, ';
      }
      message = message.slice(0, -2);
      setSnackbarMessage(message);
      setOpenSnackbar(true);
    }
  };

  const firstSelectedOption = options.find((o) => o.value === firstSelectedService) ?? null;
  const secondSelectedOption = options.find((o) => o.value === secondSelectedService) ?? null;

  return (
    <div>
      <h1>Create New Token</h1>
      <form onSubmit={handleSubmit}>
        <FormCreationSelectInput
          id="first-service-select"
          labelText="Select first service:"
          options={options}
          value={firstSelectedOption}
          onChange={(srv: SingleValue<OptionType> | MultiValue<OptionType>) => {
            if (Array.isArray(srv)) {
              setFirstSelectedService('');
              return;
            }
            const srv1 = srv as SingleValue<OptionType>;
            setFirstSelectedService(srv1 ? srv1.value : '');
          }}
          placeholder="Select first service..."
        />

        <FormCreationSelectInput
          id="second-service-select"
          labelText="Select second service:"
          options={options}
          value={secondSelectedOption}
          onChange={(srv: SingleValue<OptionType> | MultiValue<OptionType>) => {
            if (Array.isArray(srv)) {
              setSecondSelectedService('');
              return;
            }
            const srv1 = srv as SingleValue<OptionType>;
            setSecondSelectedService(srv1 ? srv1.value : '');
          }}
          placeholder="Select second service..."
        />

        <FormCreationSelectInput
          id="http-methods-select"
          labelText="Select HTTP Methods:"
          isMulti
          options={httpMethodOptions}
          value={httpMethodOptions.filter(option => selectedMethods.includes(option.value as HttpMethod))}
          onChange={(selected: MultiValue<OptionType> | SingleValue<OptionType>) => {
            if (!selected || !Array.isArray(selected)) {
              setSelectedMethods([]);
              return;
            }
            const methods = selected.map(item => item.value) as HttpMethod[];
            setSelectedMethods(methods);
          }}
          placeholder="Select permissions..."
        />

        <FormCreationInput labelText="Expiration Time:">
          <TextField
            id="expiration-time-input"
            fullWidth
            variant="outlined"
            type="number"
            value={expirationTime}
            onChange={(e) => setExpirationTime(e.target.value)}
            placeholder="Enter expiration time"
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">hours</InputAdornment>,
                inputProps: { min: 1 },
              },
            }}
            label=""
          />
        </FormCreationInput>

        <div style={{ marginTop: '30px' }}>
          <button type="submit">Create Token</button>
          <button
            type="button"
            onClick={() => navigate('/tokens')}
            style={{ marginLeft: '10px' }}
          >
            Back to Tokens
          </button>
        </div>
      </form>

      <CreationTokenDialog
        showDialogWindow={showDialogWindow}
        setShowDialogWindow={setShowDialogWindow}
        options={options}
        firstSelectedService={firstSelectedService}
        secondSelectedService={secondSelectedService}
        expirationTime={expirationTime}
        selectedMethods={selectedMethods}
        onCreateToken={handleCreateToken}
      />

      <DangerAlert
        openSnackbar={openSnackbar}
        setOpenSnackbar={setOpenSnackbar}
        snackbarMessage={snackbarMessage}
      />

    </div>
  );
}
