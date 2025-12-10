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

import { useCallback, useRef } from 'react';

type SubmitHandler = (formData: FormData) => void | Promise<void>;

/**
 * Hook useForm
 *
 * Provides refs for a form and submit button plus an imperative submit helper that gathers FormData
 * and forwards it to the provided callback.
 *
 * @returns {{ submit: (extraData?: Record<string, FormDataEntryValue>) => void, ref: React.RefObject<HTMLButtonElement>, formRef: React.RefObject<HTMLFormElement> }}
 *
 */
export default function useForm(onSubmit?: SubmitHandler) {
  const ref = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const submit = useCallback((extraData?: Record<string, FormDataEntryValue>) => {
    if (!formRef.current) {
      return;
    }
    const fd = new FormData(formRef.current);
    if (extraData) {
      Object.entries(extraData).forEach(([key, value]) => {
        fd.append(key, value);
      });
    }
    onSubmit?.(fd);
  }, [onSubmit]);

  return { submit, ref, formRef };
}
