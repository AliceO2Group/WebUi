import type { AlertVariant } from '../components/token-table/token-table-alerts';

import { useCallback } from 'react';
import { useAuth } from '~/feature/auth/hooks/session';
import { getStorageItem } from '~/utils/storage';
import useTokenTableFetchers from './token-table/useTokenTableFetchers';


export default function useTokenTableModalHandlers(
  setOpenAlert: React.Dispatch<React.SetStateAction<boolean>>,
  setAlertVariant: React.Dispatch<React.SetStateAction<AlertVariant>>,
  banFetcher: ReturnType<typeof useTokenTableFetchers>,
  unbanFetcher: ReturnType<typeof useTokenTableFetchers>,
) {
  const auth = useAuth('admin');

  const handleBan = useCallback((id: string) => {
    const fd = new FormData();
    fd.append('tokenId', id);
    if (id === 'bulk') {
      const filterInfo = getStorageItem('TKN-token-filters');
      if (filterInfo) {
        fd.append('filterInfo', filterInfo);
      }
    }
    if (auth) {
      banFetcher.submit(fd, { method: 'post', action: '/tokens/ban' });
    } else {
      setAlertVariant('auth-error');
      setOpenAlert(true);
    }
  }, [auth, banFetcher, setAlertVariant, setOpenAlert]);

  const handleUnban = useCallback((id: string) => {
    const fd = new FormData();
    fd.append('tokenId', id);
    if (id === 'bulk') {
      const filterInfo = getStorageItem('TKN-token-filters');
      if (filterInfo) {
        fd.append('filterInfo', filterInfo);
      }
    }
    if (auth) {
      unbanFetcher.submit(fd, { method: 'post', action: '/tokens/unban' });
    } else {
      setAlertVariant('auth-error');
      setOpenAlert(true);
    }
  }, [auth, unbanFetcher, setAlertVariant, setOpenAlert]);


  return { handleBan, handleUnban } as const;
}
