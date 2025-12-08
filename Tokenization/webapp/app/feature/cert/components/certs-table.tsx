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

import { type Cert } from '~/feature/cert/types/cert';
import { TableBase } from '~/shared/components/table/table-base';;

/**
 *
 *
 */
export function CertsTable({
  certs,
}: {
  certs: Cert[];
}) {
  const columns = [
    { key: 'id', label: 'ID', render: (c: Cert) => <Link to={`/certs/${c.id}`}>{c.id}</Link> },
    { key: 'service_name', label: 'Service Name' },
    { key: 'issued_at', label: 'Issued At' },
    { key: 'expires_at', label: 'Expires At' },
    { key: 'ip_address', label: 'IP Address' },
  ];
  return <TableBase<Cert>
    data={certs}
    columns={columns}
  />;
}
