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

import { FormInputNumber } from '~/shared/components/form/form-input';
import { ResetButton, SubmitButton } from '~/shared/components/form/form-buttons';
import { useTokenFormState, useTokenFormMeta } from '~/feature/token/hooks/token-form/index';
import { Form } from '~/shared/components/form/form';
import ServiceSelectGroup from './ServiceSelectGroup';
import MethodsSelect from './MethodsSelect';
import TokenFormWindows from './TokenFormWindows';

/**
 * Token Form component
 */
export function TokenForm() {
  const { firstSelectedService,
    secondSelectedService,
    selectedMethods,
    expirationTime,
    setExpirationTime,
    setFirstSelectedService,
    setSecondSelectedService,
    setSelectedMethods,
    onSubmit,
    onReset,
  } = useTokenFormState();
  const { fetcher, submitRef, loaderData } = useTokenFormMeta();
  return (
    <>
      <Form submitRef={submitRef} fetcher={fetcher} action="/tokens/new">
        <FormInputNumber
          name="expiration-time"
          labelText="Expiration Time (hours):"
          value={expirationTime}
          setValue={setExpirationTime}
        />
        <MethodsSelect value={selectedMethods} setValue={setSelectedMethods} />
        {loaderData && (
          <>
            <ServiceSelectGroup
              loaderData={loaderData}
              firstValue={firstSelectedService}
              secondValue={secondSelectedService}
              onFirstChange={setFirstSelectedService}
              onSecondChange={setSecondSelectedService}
            />
            <div className="mv3 flex-row g1 align-center">
              <SubmitButton action={onSubmit} />
              <ResetButton action={onReset} />
            </div>
          </>
        )}
      </Form>
      <TokenFormWindows />
    </>
  );
}
