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

import { useCallback, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { useServiceCertificateConfirmMutation, useServiceCertificateUploadMutation } from '~/feature/service/api/mutations';
import type { ServiceCertificatePreview } from '~/feature/service/types/certificate';
import { useAuth } from '~/feature/auth/hooks/session';
import { useAlert } from '~/shared/hooks/useAlert';
import { AUTH_ERROR_ALERT } from '~/ui/alert/constants';
import useModal from '~/shared/hooks/useModal';
import { isSupportedCertificate } from '../hooks/certificateUtils';

/**
 * Renders the registration form for uploading service certificates.
 */
export default function ServiceRegistrationRoute() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showModal, hideModal } = useModal();
  const hasAuth = useAuth();
  const pushAlert = useAlert();
  const { mutate: uploadCertificate, isPending: isUploading } = useServiceCertificateUploadMutation();
  const { mutate: confirmCertificate } = useServiceCertificateConfirmMutation();
  const clearFileSelection = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const finalizeRegistration = useCallback(async (certificateId: string) => {
    if (!hasAuth) {
      hideModal();
      pushAlert(AUTH_ERROR_ALERT);
      return;
    }
    confirmCertificate(certificateId, {
      onSuccess: () => {
        hideModal();
        clearFileSelection();
        pushAlert({ message: 'Service registered successfully.', severity: 'success' });
      },
      onError: () => {
        hideModal();
        pushAlert({ message: 'Failed to confirm service registration.', severity: 'error' });
      },
    });
  }, [clearFileSelection, confirmCertificate, hasAuth, hideModal, pushAlert]);

  const openPreviewModal = useCallback((preview: ServiceCertificatePreview) => {
    showModal({
      title: 'Confirm certificate registration',
      content: <CertificatePreviewDetails preview={preview} />,
      confirmLabel: 'Register service',
      cancelLabel: 'Cancel',
      onConfirm: () => finalizeRegistration(preview.certificateId),
    });
  }, [finalizeRegistration, showModal]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      clearFileSelection();
      setFileError(null);
      return;
    }
    if (!isSupportedCertificate(file.name)) {
      clearFileSelection();
      setFileError('Only .cert, .crt or .pem files are supported.');
      return;
    }
    setSelectedFile(file);
    setFileError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setFileError('Select a certificate file to continue.');
      return;
    }
    showModal({
      title: 'Validating certificate',
      confirmLabel: 'Register',
      cancelLabel: 'Cancel',
      isLoading: true,
    });
    if (!hasAuth) {
      hideModal();
      pushAlert(AUTH_ERROR_ALERT);
      return;
    }
    uploadCertificate(selectedFile, {
      onSuccess: (preview) => {
        openPreviewModal(preview);
      },
      onError: () => {
        hideModal();
        pushAlert({ message: 'Failed to process certificate file.', severity: 'error' });
      },
    });
  };

  return (
    <Stack spacing={3}>
      <Typography variant='h5'>Register service by providing its certificate file with .cert, .crt or .pem extension</Typography>
      <FormCardForm onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography variant='subtitle1'>Certificate file</Typography>
            <Button variant='outlined' component='label'>
              Select certificate
              <input
                type='file'
                id='cert-upload'
                accept='.cert,.crt,.pem'
                onChange={handleFileChange}
                ref={fileInputRef}
                hidden
              />
            </Button>
            {selectedFile ? (
              <Typography variant='body2' color='text.secondary'>
                Selected file: {selectedFile.name}
              </Typography>
            ) : (
              <Typography variant='body2' color='text.secondary'>No file selected</Typography>
            )}
            {fileError ? (
              <Typography variant='body2' color='error'>{fileError}</Typography>
            ) : null}
          </Stack>
          <Button type='submit' variant='contained' disabled={!selectedFile || isUploading}>
            Register service
          </Button>
        </Stack>
      </FormCardForm>
    </Stack>
  );
}

const FormCardForm = styled('form')(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(3),
  maxWidth: 640,
}));

type CertificatePreviewDetailsProps = {
  preview: ServiceCertificatePreview;
};

/**
 * Component to display the details of a service certificate preview.
 *
 * @param preview The certificate preview details to display.
 */
const CertificatePreviewDetails = ({ preview }: CertificatePreviewDetailsProps) => (
  <Stack spacing={1.5}>
    <Typography variant='body2'>Certificate ID: {preview.certificateId}</Typography>
    <Typography variant='body2'>Status: {preview.status}</Typography>
    <Typography variant='body2'>Subject: {preview.subject}</Typography>
    <Typography variant='body2'>Common name: {preview.commonName}</Typography>
    <Typography variant='body2'>Issuer: {preview.issuer}</Typography>
    <Typography variant='body2'>Valid from: {new Date(preview.validFrom).toLocaleString()}</Typography>
    <Typography variant='body2'>Valid to: {new Date(preview.validTo).toLocaleString()}</Typography>
    <Typography variant='body2'>Fingerprint: {preview.fingerprint}</Typography>
  </Stack>
);
