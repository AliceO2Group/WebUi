import type { Cert } from '~/feature/cert/types/cert';
import { Box1_1 } from '~/ui/box';
import { CertsFilter } from '~/feature/cert/components/certs-filter';
import { CertsTable } from '~/feature/cert/components/certs-table';

export default function CertsTableRouteView({ certs }: { certs: Cert[] }) {
  return <Box1_1 link={null}>
    <CertsFilter />
    <CertsTable certs={certs} />
  </Box1_1>;
}