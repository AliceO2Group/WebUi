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
import { Link, useParams } from 'react-router';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { useServiceDetailsQuery } from '~/feature/service/api/queries';
import { useServiceCertificateRenewConfirmMutation, useServiceCertificateUploadMutation } from '~/feature/service/api/mutations';
import type { ServiceCertificatePreview } from '~/feature/service/types/certificate';
import { useAuth } from '~/feature/auth/hooks/session';
import { useAlert } from '~/shared/hooks/useAlert';
import useModal from '~/shared/hooks/useModal';
import { AUTH_ERROR_ALERT } from '~/ui/alert/constants';

/**
 *
 */
export default function ServiceRenewRoute() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const hasServiceId = Boolean(serviceId);
  const serviceQuery = useServiceDetailsQuery({ serviceId: serviceId ?? '', enabled: hasServiceId });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasAuth = useAuth();
  const pushAlert = useAlert();
  const { showModal, hideModal } = useModal();
  const { mutate: uploadCertificate, isPending: isUploading } = useServiceCertificateUploadMutation();
  const { mutate: confirmRenewal } = useServiceCertificateRenewConfirmMutation();

  const clearFileSelection = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const finalizeRenewal = useCallback((certificateId: string) => {
    if (!hasAuth) {
      hideModal();
      pushAlert(AUTH_ERROR_ALERT);
      return;
    }
    if (!serviceId) {
      hideModal();
      pushAlert({ message: 'Missing service identifier.', severity: 'error' });
      return;
    }
    confirmRenewal({ serviceId, certificateId }, {
      onSuccess: () => {
        hideModal();
        clearFileSelection();
        pushAlert({ message: 'Service certificate renewed successfully.', severity: 'success' });
      },
      onError: () => {
        hideModal();
        pushAlert({ message: 'Failed to confirm certificate renewal.', severity: 'error' });
      },
    });
  }, [clearFileSelection, confirmRenewal, hasAuth, hideModal, pushAlert, serviceId]);

  const openPreviewModal = useCallback((preview: ServiceCertificatePreview, currentExpiry?: string) => {
    showModal({
      title: 'Confirm certificate renewal',
      content: <RenewalPreviewDetails preview={preview} currentExpiry={currentExpiry} />,
      confirmLabel: 'Renew certificate',
      cancelLabel: 'Cancel',
      onConfirm: () => finalizeRenewal(preview.certificateId),
    });
  }, [finalizeRenewal, showModal]);

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setFileError('Select a certificate file to continue.');
      return;
    }
    showModal({
      title: 'Validating renewal',
      confirmLabel: 'Renew',
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
        const commonName = serviceQuery.data?.commonName;
        if (preview.commonName !== commonName) {
          pushAlert({ message: `Warning: The common name in the uploaded 
            certificate does not match the service common name.`, severity: 'warning' });
          hideModal();
        } else {
          openPreviewModal(preview, serviceQuery.data?.exp);
        }
      },
      onError: () => {
        hideModal();
        pushAlert({ message: 'Failed to process renewal file.', severity: 'error' });
      },
    });
  };

  if (!hasServiceId) {
    return <Alert severity="error">Missing service identifier.</Alert>;
  }

  if (serviceQuery.isLoading) {
    return (
      <Centered>
        <CircularProgress />
      </Centered>
    );
  }

  if (serviceQuery.isError) {
    return <Alert severity="error">Failed to load service details.</Alert>;
  }

  if (!serviceQuery.data) {
    return <Alert severity="warning">Service not found.</Alert>;
  }

  const service = serviceQuery.data;
  const detailsPath = `/services/${service.serviceId}`;

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
          <Typography variant="h5">Renew certificate for {service.commonName}</Typography>
          <Button component={Link} to={detailsPath} variant="outlined">
            Back to details
          </Button>
        </Stack>
        <DetailsGrid>
          <InfoItem label="Service ID" value={service.serviceId} />
          <InfoItem label="Current expiry" value={new Date(service.exp).toLocaleString()} />
          <InfoItem label="Issued at" value={new Date(service.iat).toLocaleString()} />
        </DetailsGrid>
      </Paper>

      <FormCardForm onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography variant="subtitle1">Renewal certificate file</Typography>
            <Button variant="outlined" component="label">
              Select certificate
              <input
                type="file"
                accept=".cert,.crt,.pem"
                onChange={handleFileChange}
                ref={fileInputRef}
                hidden
              />
            </Button>
            {selectedFile ? (
              <Typography variant="body2" color="text.secondary">
                Selected file: {selectedFile.name}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">No file selected</Typography>
            )}
            {fileError ? (
              <Typography variant="body2" color="error">{fileError}</Typography>
            ) : null}
          </Stack>
          <Button type="submit" variant="contained" disabled={!selectedFile || isUploading}>
            Validate renewal
          </Button>
        </Stack>
      </FormCardForm>
    </Stack>
  );
}

const DetailsGrid = styled('div')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2),
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}));

const FormCardForm = styled('form')(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(3),
  maxWidth: 640,
}));

const Centered = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '60vh',
  width: '100%',
}));

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <Stack spacing={0.5}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1">{value}</Typography>
  </Stack>
);

/**
 *
 */
function RenewalPreviewDetails({ preview, currentExpiry }: {
  preview: ServiceCertificatePreview;
  currentExpiry?: string;
}) {
  const previousExpiryDate = currentExpiry ? new Date(currentExpiry) : null;
  const nextExpiryDate = new Date(preview.validTo);
  const expiryRegression = previousExpiryDate ? nextExpiryDate.getTime() < previousExpiryDate.getTime() : false;

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2">Certificate ID: {preview.certificateId}</Typography>
      <Typography variant="body2">Status: {preview.status}</Typography>
      <Typography variant="body2">Subject: {preview.subject}</Typography>
      <Typography variant="body2">Common name: {preview.commonName}</Typography>
      <Typography variant="body2">Issuer: {preview.issuer}</Typography>
      <Typography variant="body2">Valid from: {new Date(preview.validFrom).toLocaleString()}</Typography>
      <Typography variant="body2">Valid to: {nextExpiryDate.toLocaleString()}</Typography>
      <Typography variant="body2">Fingerprint: {preview.fingerprint}</Typography>
      {previousExpiryDate ? (
        <Typography variant="body2">Previous expiry: {previousExpiryDate.toLocaleString()}</Typography>
      ) : null}
      {expiryRegression ? (
        <Alert severity="warning">The new expiry date is earlier than the current certificate expiry. Confirm only if this is expected.</Alert>
      ) : null}
    </Stack>
  );
}

/**
 *
 */
function isSupportedCertificate(name: string) {
  return /\.(cert|crt|pem)$/i.test(name);
}
