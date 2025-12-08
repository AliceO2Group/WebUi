import type { OptionType } from "~/utils/types";

import { TokenFormProvider } from '~/feature/token/contexts/token-form';
import { TokenForm, TokenFormWindows } from '~/feature/token/components/token-form';
import { Box1_1 } from '~/ui/box';

export default function CreateTokenView({ serviceOptions }: { serviceOptions?: OptionType[] }) { 
  return (
    <TokenFormProvider loaderData={serviceOptions}>
      <Box1_1 link={null}>
        <TokenForm />
      </Box1_1>
      <TokenFormWindows />
    </TokenFormProvider>
  );
}