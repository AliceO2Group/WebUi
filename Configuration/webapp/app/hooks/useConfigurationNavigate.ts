import { useNavigate } from 'react-router';
import { BASE_CONFIGURATION_PATH } from '~/config';

export const useConfigurationNavigate = () => {
  const reactRouterNavigate = useNavigate();
  const navigate = (relativePath: string) => {
    reactRouterNavigate(`${BASE_CONFIGURATION_PATH}/${relativePath}`);
  };

  return navigate;
};
