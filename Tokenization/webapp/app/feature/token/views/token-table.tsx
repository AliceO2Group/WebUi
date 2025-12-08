import { Suspense } from 'react';

import { Box1_2 } from '~/ui/box';
import { Spinner } from '~/ui/spinner';
import { Await } from 'react-router';
import type { Token } from '~/feature/token/types/token';
import { TokenTableExtended } from '~/feature/token/components/token-table';
import { TokenFilters } from '~/feature/token/components/token-filters';
import { TokenFiltersProvider } from '~/feature/token/contexts/token-filters';

export default function TokenTableRouteiew({ tokens }: { tokens: Promise<Token[]> }) {
  return <TokenFiltersProvider>
    <Box1_2 link={null}>
      <div className="mv2"></div>
      <TokenFilters />
      <Suspense fallback={<Spinner align='center' />}>
        <Await resolve={tokens}>
          {(resolvedTokens: Token[]) => <TokenTableExtended tokens={resolvedTokens}/>}
        </Await>
      </Suspense>
    </Box1_2>
  </TokenFiltersProvider>;
}