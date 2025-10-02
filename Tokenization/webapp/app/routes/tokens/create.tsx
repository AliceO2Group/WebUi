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

import { DangerAlert } from '~/ui/alert';
import { CreationTokenDialog } from '~/ui/dialog';
import { useAuth, useSession } from '~/hooks/session';

export interface OptionType {
  value: string;
  label: string;
}

/**
 *
 */
export function clientLoader(): OptionType[] {
  return [
    { value: 'service1', label: 'Service 1' },
    { value: 'service2', label: 'Service 2' },
    { value: 'service3', label: 'Service 3' },
    { value: 'service4', label: 'Service 4' },
  ];
}

export type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PUT';

// Opcje metod HTTP
const httpMethodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
];

/**
 *
 */
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

  const auth = useAuth('admin')

  const resetForm = useCallback(() => {
    setExpirationTime('');
    setFirstSelectedService('');
    setSecondSelectedService('');
    setSelectedMethods([]);
  }, []);

  const handleCreateToken = useCallback(() => {
    if(auth)
    {
      console.log('Creating token...', {
        first: firstSelectedService,
        second: secondSelectedService,
        expiration: expirationTime,
        permissions: selectedMethods,
      });      
    }else{
      setSnackbarMessage("Authorization error");
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
      if(selectedMethods.length == 0) {
        message += 'HTTP methods, '
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
        <div style={{ marginBottom: '20px' }}>
          <label>Select first service:</label>
          <Select<OptionType>
            options={options}
            value={firstSelectedOption}
            onChange={(srv: SingleValue<OptionType>) => {
              setFirstSelectedService(srv ? srv.value : '');
            }}
            placeholder="Select first service..."
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label>Select second service:</label>
          <Select<OptionType>
            options={options}
            value={secondSelectedOption}
            onChange={(srv: SingleValue<OptionType>) => {
              setSecondSelectedService(srv ? srv.value : '');
            }}
            placeholder="Select second service..."
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Select HTTP Methods:</label>
          <Select
            isMulti
            options={httpMethodOptions}
            value={httpMethodOptions.filter(option => selectedMethods.includes(option.value as HttpMethod))}
            onChange={(selected: MultiValue<{ value: string; label: string }>) => {
              const methods = selected.map(item => item.value) as HttpMethod[];
              setSelectedMethods(methods);
            }}
            placeholder="Select permissions..."
          />
        </div>

        <div >
          <label>Expiration Time:</label>
          <TextField
            fullWidth
            variant="outlined"
            type="number"
            value={expirationTime}
            onChange={(e) => setExpirationTime(e.target.value)}
            placeholder="Enter expiration time"
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">hours</InputAdornment>,
                inputProps: { min: 1 }
              }
            }}
            label=""
          />
        </div>

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
