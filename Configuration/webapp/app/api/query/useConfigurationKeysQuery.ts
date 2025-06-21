import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axiosInstance';

export const CONFIGURATION_KEYS_QUERY_KEY = 'configuration-keys';

export const useConfigurationKeysQuery = () =>
  useQuery({
    queryKey: [CONFIGURATION_KEYS_QUERY_KEY],
    queryFn: async () =>
      axiosInstance
        .get('configurations/')
        .then((response) => response.data.map((key) => key.split('/').pop())),
  });
