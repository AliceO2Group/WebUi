import { type Cert } from "./cert";

import { TableBase } from "../table/table-base";

export function CertsTable({
    certs,
}: {
    certs: Cert[];
}) {
    const columns = [
        {key: 'id', label: 'ID' },
        {key: 'service_name', label: 'Service Name' },
        {key: 'issued_at', label: 'Issued At' },
        {key: 'expires_at', label: 'Expires At' },
        {key: 'ip_address', label: 'IP Address' },
    ]
    return <TableBase<Cert> 
        data={certs} 
        columns={columns} 
        />;
}