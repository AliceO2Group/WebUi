import { Suspense } from "react";
import { useLoaderData } from "react-router";

import { Box1_2 } from "~/components/box";
import { Spinner } from "~/ui/spinner";
import { Await } from "react-router";
import type { Token } from "~/components/tokens/token";
import { TokenTableWithIssuedAt } from "~/components/tokens/token-table";
import { TokenFilters } from "~/components/tokens/token-filters";

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

export default function TokensTable() {
  const {tokens} = useLoaderData();
  return <Box1_2 link={null}>
    <Suspense fallback={<Spinner align='center' />}>
        <div className="mv3"></div>
        <TokenFilters />
        <Await resolve={tokens}>
              {(resolvedTokens: Token[]) => <TokenTableWithIssuedAt tokens={resolvedTokens}/>}
        </Await>
    </Suspense>
  </Box1_2>
}