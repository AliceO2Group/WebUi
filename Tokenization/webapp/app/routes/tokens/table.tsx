import { Suspense } from "react";
import { useLoaderData } from "react-router";

import { Box1_2 } from "~/components/box";
import { Spinner } from "~/ui/spinner";
import { Await } from "react-router";
import type { Token } from "~/components/tokens/token";
import { TokenTableExtended } from "~/components/tokens/token-table";
import { TokenFilters } from "~/components/tokens/token-filters";
import { TokenFiltersContext, TokenFiltersProvider } from "~/contexts/tokens/token-filters";

//eslint-disable-next-line jsdoc/require-jsdoc
export function clientLoader() {
    const tokens = fetch('/api/tokens')
    .then(response => {
      if (!response.ok) {
        throw new Error('An error occurred!');
      }
      return response.json();
    });

  return { tokens };
}

//eslint-disable-next-line jsdoc/require-jsdoc
export default function TokensTable() {
  const {tokens} = useLoaderData();
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