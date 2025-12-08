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

import { useCallback, useState, type FC, type PropsWithChildren } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import Stack from '@mui/material/Stack';

import { Widget } from './Widget';
import { AccordionHeader } from './AccordionHeader';
import { RawViewModal } from './raw-view/RawViewModal';

export type FormItem = { [key: string]: string | object | FormItem };

export type FormRestrictions = {
  [key: string]: 'string' | 'number' | 'boolean' | 'array' | FormRestrictions;
};

interface FormProps extends PropsWithChildren {
  sectionTitle: string;
  items: FormItem;
  itemsRestrictions: FormRestrictions;
}

/**
 * Function which returns false if the given object
 * which describes restrictions is the leaf (string, number, bool, array)
 * or returns true if the given object describes restrictions recursively
 * @param {'string' | 'number' | 'boolean' | 'array' | FormRestrictions} obj
 * the object which describes restrictions
 * @returns {boolean} value which indicates if the restrictions are recursive
 * or if this is the leaf of the FormRestrictions tree
 */
function isFormRestrictions(obj: FormRestrictions[string]): obj is FormRestrictions {
  return obj instanceof Object && !(obj instanceof Array);
}

export const Form: FC<FormProps> = ({ sectionTitle, items, itemsRestrictions }) => {
  const [isRawModalOpen, setIsRawModalOpen] = useState<boolean>(false);

  const renderItem = useCallback(
    (key: string, value: FormRestrictions[string]) =>
      isFormRestrictions(value) ? (
        <Form
          key={key}
          sectionTitle={key}
          items={items[key] as FormItem}
          itemsRestrictions={itemsRestrictions[key] as FormRestrictions}
        />
      ) : (
        <Widget key={key} title={key} type={value} value={items[key]} />
      ),
    [items, itemsRestrictions],
  );

  return (
    <>
      <Accordion defaultExpanded>
        <AccordionHeader title={sectionTitle} viewFormToggle={() => setIsRawModalOpen(true)} />
        <AccordionDetails>
          <Stack spacing={2}>
            {Object.entries(itemsRestrictions).map(([key, value]) => renderItem(key, value))}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {isRawModalOpen && (<RawViewModal
        open={isRawModalOpen}
        onClose={() => setIsRawModalOpen(false)}
        title={sectionTitle}
        data={items}
      />)}
    </>
  );
};
