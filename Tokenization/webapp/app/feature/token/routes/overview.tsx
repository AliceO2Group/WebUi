import { useCallback, useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { TokenFiltersForm, type TokenFilterValues, TOKEN_FILTER_DEFAULTS } from '~/feature/token/components/token-filters-form';
import { TokensTable } from '~/feature/token/components/token-table';
import { useServicesOptions } from '~/feature/token/hooks/useServicesOptions';
import { mockTokens } from '~/feature/token/mocks/tokens.mock';
import type { Token } from '~/feature/token/types/token';

const issuers = Array.from(new Set(mockTokens.map((token) => token.issuer))).sort();
const serviceSeeds = Array.from(new Set(
  mockTokens.flatMap((token) => [token.serviceFrom, token.serviceTo])
));

export default function TokensOverviewRoute() {
  const [filters, setFilters] = useState<TokenFilterValues>(TOKEN_FILTER_DEFAULTS);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const { options: serviceOptions, loading: servicesLoading } = useServicesOptions(serviceSeeds);

  const handleFiltersChange = useCallback((values: TokenFilterValues) => {
    setFilters(values);
  }, []);

  const toggleFiltersPanel = useCallback(() => {
    setFiltersOpen((prev) => !prev);
  }, []);

  const filteredTokens = useMemo(() =>
    mockTokens.filter((token) => {
      const serviceFromMatch = filters.serviceFrom.length === 0 || filters.serviceFrom.includes(token.serviceFrom);
      const serviceToMatch = filters.serviceTo.length === 0 || filters.serviceTo.includes(token.serviceTo);
      const issuerMatch = !filters.issuer || token.issuer === filters.issuer;
      const tokenIdMatch = !filters.tokenId || token.tokenId.includes(filters.tokenId);
      return serviceFromMatch && serviceToMatch && issuerMatch && tokenIdMatch;
    }),
  [filters]);

  const handleRevoke = useCallback((_token: Token) => {
    // TODO: wire with revoke mutation once backend is ready
  }, []);

  return (
    <Stack spacing={3}>
      <FiltersCard elevation={0}>
        <FiltersHeader>
          <Typography variant="h6">Filters</Typography>
          <Button size="small" variant="text" onClick={toggleFiltersPanel}>
            {filtersOpen ? 'Hide' : 'Show'}
          </Button>
        </FiltersHeader>
        <Collapse in={filtersOpen} timeout="auto" unmountOnExit>
          <FiltersBody>
            <TokenFiltersForm
              issuers={issuers}
              serviceOptions={serviceOptions}
              loadingServices={servicesLoading}
              onFiltersChange={handleFiltersChange}
            />
          </FiltersBody>
        </Collapse>
      </FiltersCard>

      <TokensTable
        tokens={filteredTokens}
        totalCount={mockTokens.length}
        onRevoke={handleRevoke}
      />
    </Stack>
  );
}

const FiltersCard = styled(Paper)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  boxShadow: 'none',
}));

const FiltersHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
}));

const FiltersBody = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
}));
