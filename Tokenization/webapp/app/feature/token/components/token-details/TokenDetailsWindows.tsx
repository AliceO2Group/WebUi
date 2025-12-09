import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';

import { TokenModalBan } from '~/feature/token/components/token-table/token-table-modals/TokenModalBan';
import { TokenModalUnban } from '~/feature/token/components/token-table/token-table-modals/TokenModalUnban';
import TokenAlert, { type AlertVariant } from '~/feature/token/components/token-table/token-table-alerts';
import useTokenModalHandlers from '../../hooks/useTokenModalHandlers';

type Props = {
  tokenId: string;
  banned: boolean;
  setBanned: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function TokenDetailsWindows({ tokenId, banned, setBanned }: Props) {
  const [openModal, setOpenModal] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertVariant, setAlertVariant] = useState<AlertVariant>('token-banned-success');

  const banFetcher = useFetcher();
  const unbanFetcher = useFetcher();

  const openConfirm = () => setOpenModal(true);

  const { handleBan, handleUnban } = useTokenModalHandlers(
    setAlertOpen,
    setAlertVariant,
    banFetcher,
    unbanFetcher,
  );
 
  useEffect(() => {
    if (banFetcher.state === 'idle' && banFetcher.data) {
      const success = (banFetcher.data as any).success;
      setAlertVariant(success ? 'token-banned-success' : 'token-banned-failed');
      setAlertOpen(true);
      if(success) {
        setBanned(success ? true : banned);
      }
    }
  }, [banFetcher.state, banFetcher.data]);

  useEffect(() => {
    if (unbanFetcher.state === 'idle' && unbanFetcher.data) {
      const success = (unbanFetcher.data as any).success;
      setAlertVariant(success ? 'token-unbanned-success' : 'token-unbanned-failed');
      setAlertOpen(true);
      if(success) {
        setBanned(success ? false : banned);
      }
    }
  }, [unbanFetcher.state, unbanFetcher.data]);

  return (
    <>
      {banned ? (
        <button className="btn btn-primary" onClick={openConfirm}>Unban token</button>
      ) : (
        <button className="btn btn-danger" onClick={openConfirm}>Ban token</button>
      )}

      {/* Modal: reuse presentational modal components and pass onConfirm that executes fetcher */}
      {banned ? (
        <TokenModalUnban open={openModal} setOpen={setOpenModal} tokenId={tokenId} onConfirm={() => { handleUnban(tokenId); setOpenModal(false); }} />
      ) : (
        <TokenModalBan open={openModal} setOpen={setOpenModal} tokenId={tokenId} onConfirm={() => { handleBan(tokenId); setOpenModal(false); }} />
      )}

      <TokenAlert variant={alertVariant} open={alertOpen} setOpen={setAlertOpen} />
    </>
  );
}
