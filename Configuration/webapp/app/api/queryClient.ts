import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // time in milliseconds: here it's 5 minutes
      // refetchOnWindowFocus: false,
    },
  },
});

let persister;

if (typeof window !== 'undefined') {
  persister = createSyncStoragePersister({
    storage: window.localStorage,
  });
}

export { persister };
export default queryClient;
