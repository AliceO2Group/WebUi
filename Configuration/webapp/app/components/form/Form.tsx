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
import { Typography } from '@mui/material';
import type { Control } from 'react-hook-form';
import { type InputsType } from '~/routes/configuration';
import { KEY_SEPARATOR } from './constants';

export type FormItem = { [key: string]: string | object | FormItem };

export type FormRestrictions = {
  [key: string]: 'string' | 'number' | 'boolean' | 'array' | FormRestrictions;
};

interface FormProps extends PropsWithChildren {
  sectionTitle: string;
  sectionPrefix: string;
  items: FormItem;
  itemsRestrictions: FormRestrictions;
  control: Control<InputsType>;
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

/**
 * Form component.
 * @param {FormProps} props - The props of the form.
 * @param {string} props.sectionTitle - The title of the section.
 * @param {string} props.sectionPrefix - The prefix of the section.
 * @param {FormItem} props.items - The items of the form.
 * @param {FormRestrictions} props.itemsRestrictions - The restrictions of the items.
 * @param {Control<InputsType>} props.control - The control of the form.
 * @returns {ReactElement} The form component.
 */
export const Form: FC<FormProps> = ({
  sectionTitle,
  sectionPrefix,
  items,
  itemsRestrictions,
  control,
}) => {
  const [viewForm, setViewForm] = useState<boolean>(true);

  const renderItem = useCallback(
    (key: string, value: FormRestrictions[string]) =>
      isFormRestrictions(value) ? (
        <Form
          key={key}
          sectionTitle={key}
          sectionPrefix={`${sectionPrefix}${KEY_SEPARATOR}${key}`}
          items={items[key] as FormItem}
          itemsRestrictions={itemsRestrictions[key] as FormRestrictions}
          control={control}
        />
      ) : (
        <Widget
          key={key}
          sectionPrefix={`${sectionPrefix}${KEY_SEPARATOR}${key}`}
          label={key}
          type={value}
          value={items[key]}
          control={control}
        />
      ),
    [items, itemsRestrictions],
  );

  return (
    <Accordion defaultExpanded>
      <AccordionHeader
        title={sectionTitle}
        viewForm={viewForm}
        viewFormToggle={() => setViewForm((v) => !v)}
      />
      <AccordionDetails>
        {viewForm ? (
          <Stack spacing={2}>
            {Object.entries(itemsRestrictions).map(([key, value]) => renderItem(key, value))}
          </Stack>
        ) : (
          <Typography component="pre">{JSON.stringify(items, null, 2)}</Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
};
