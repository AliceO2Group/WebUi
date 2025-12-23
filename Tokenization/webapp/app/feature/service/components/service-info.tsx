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

import { Link } from 'react-router';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Service } from '../types/service';
import DataGrid from '~/shared/components/data-grid';

export default function ServiceInfo({ service }: { service: Service | undefined }) {
	const renewPath = `/services/${service?.serviceId}/renew`;  
    const info = [
        { label: 'Service ID', value: service?.serviceId ?? '' },
        { label: 'Common name', value: service?.commonName ?? '' },
        { label: 'Issued at', value: service?.iat ? new Date(service.iat).toLocaleString() : '' },
        { label: 'Expires', value: service?.exp ? new Date(service.exp).toLocaleString() : '' },
    ]

    return <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
				<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
					<Typography variant="h5">Service certificate</Typography>
					<Button component={Link} to={renewPath} variant="contained">
						Renew certificate
					</Button>
				</Stack>
				<Divider sx={{ my: 2 }} />
				<DataGrid info={info} />
			</Paper>

}





