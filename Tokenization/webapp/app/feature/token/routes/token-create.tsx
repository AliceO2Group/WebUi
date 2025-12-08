/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { TokenFormProvider } from '~/feature/token/contexts/token-form';
import { TokenForm, TokenFormWindows } from '~/feature/token/components/token-form';
import { Box1_1 } from '~/ui/box';
import type { OptionType } from '~/utils/types';

// eslint-disable-next-line jsdoc/require-jsdoc
export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  // eslint-disable-next-line no-console
  console.log(Object.fromEntries(formData.entries()));
  return { success: true };
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function clientLoader(): OptionType[] {
  return [
    { value: 'service1', label: 'Service 1' },
    { value: 'service2', label: 'Service 2' },
    { value: 'service3', label: 'Service 3' },
    { value: 'service4', label: 'Service 4' },
  ];
}

/**
 * Component is used for /tokens/new route to create new tokens.
 */
export default function CreateToken({ loaderData }: { loaderData?: OptionType[] }) {
  return (
    <TokenFormProvider loaderData={loaderData}>
      <Box1_1 link={null}>
        <TokenForm />
      </Box1_1>
      <TokenFormWindows />
    </TokenFormProvider>
  );
}
