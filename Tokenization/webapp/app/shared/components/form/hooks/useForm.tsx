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
import { useFetcher } from 'react-router';

/**
 * Hook useForm
 *
 * Provides a fetcher form along with a submit function and a ref to the form element. It cooperates with
 * <Form> component to allow programmatic form submission.
 *
 * @returns {fetcher: ReturnType<typeof useFetcher>, submit: () => void, ref: React.RefObject<HTMLFormElement>}
 *
 */
export default function useForm() {
  const fetcher = useFetcher();
  const ref = useRef<HTMLButtonElement>(null);
  const submit = useCallback((extraData?: object) => {
    const fd = new FormData(ref.current?.form || undefined);
    if (extraData) {
      Object.entries(extraData).forEach(([key, value]) => {
        fd.append(key, value as string);
      });
    }
    const action = ref.current?.dataset?.action ?? '';
    fetcher.submit(fd, { method: 'post', action });
  }, [ref]);

  return { fetcher, submit, ref };
}
