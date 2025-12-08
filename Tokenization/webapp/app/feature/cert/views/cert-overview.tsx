import { useFetcher } from 'react-router';

import type { Cert } from '../types/cert';
import { Box1_2 } from '~/ui/box';
import { CertsForm } from '~/feature/cert/components/certs-form';
import { CertsTable } from '~/feature/cert/components/certs-table';
import { useOpenCertModal } from '~/feature/cert/hooks/cert-modal';
import { CertsModal } from '~/feature/cert/components/certs-modal';

export default function CertsOverviewView({ certs }: { certs: Cert[] }) {
  const fetcher = useFetcher();
  const [certModalOpen, setCertModalOpen] = useOpenCertModal(fetcher);

  return (
    <>
      <div className="grid-1-2">
        <Box1_2 link={'/certs/table'}>
          <div className="flex-row justify-center">
            <h4> Registered services</h4>
          </div>
          <CertsTable certs={certs} />
        </Box1_2>
        <Box1_2 link={null}>
          <CertsForm fetcher={fetcher} />
        </Box1_2>
      </div>
      <CertsModal
        open={certModalOpen as boolean}
        setOpen={setCertModalOpen as React.Dispatch<React.SetStateAction<boolean>>}
        fetcher={fetcher}
      />
    </>
  );
}