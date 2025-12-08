import { Await } from 'react-router';
import { Suspense } from 'react';

import type { Token } from '../types/token';
import { Spinner } from '~/ui/spinner';
import { Box1_2 } from '~/ui/box';
import { TokenTable } from '../components//token-table';

export default function TokenOverviewView({tokens}: {tokens: Promise<Token[]>}) {
  return (
    <div className="grid-1-2">
      <Box1_2 link="/tokens/table">
        <Suspense fallback={<Spinner align='center' />}>
          <Await resolve={tokens}>
            {(resolvedTokens: Token[]) => <TokenTable tokens={resolvedTokens}/>}
          </Await>
        </Suspense>
      </Box1_2>

      <Box1_2 link="/tokens/new">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Create Token</h2>
          <p>Form to create a new token will go here.</p>
        </div>
      </Box1_2>
    </div>
  );
}