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

import { useState, type FC, type PropsWithChildren } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import Stack from '@mui/material/Stack';
import { AccordionHeader } from './AccordionHeader';
import { Typography } from '@mui/material';
import { FormItem } from './FormItem';

export type FormValue = FormPrimitiveValue | FormArrayValue | FormObjectValue;

export type FormPrimitiveValue = string | number | boolean;

export type FormArrayValue = Array<FormValue>;

export type FormObjectValue = { [key: string]: FormValue };

export type PrimitiveRestrictions = 'string' | 'number' | 'boolean';

export type ArrayRestrictions = [
  Array<Restrictions>,
  ObjectRestrictions | null, // Restrictions for an object directly in the array
  ArrayRestrictions | null, // ArrayRestrictions for a directly nested array
];

export type ObjectRestrictions = {
  [key: string]: Restrictions;
};

export type Restrictions = PrimitiveRestrictions | ArrayRestrictions | ObjectRestrictions;

interface FormProps extends PropsWithChildren {
  sectionTitle: string;
  items: FormObjectValue;
  itemsRestrictions: ObjectRestrictions;
}

export const Form: FC<FormProps> = ({ sectionTitle, items, itemsRestrictions }) => {
  const [viewForm, setViewForm] = useState<boolean>(true);

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
            {Object.entries(items).map(([key, value]) => (
              <FormItem
                key={key}
                sectionTitle={key}
                value={value}
                restrictions={itemsRestrictions[key]}
              />
            ))}
          </Stack>
        ) : (
          <Typography component="pre">{JSON.stringify(items, null, 2)}</Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
};
