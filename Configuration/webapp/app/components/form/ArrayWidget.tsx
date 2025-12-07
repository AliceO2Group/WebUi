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

import { useState, type ReactElement } from 'react';
import { type ArrayRestrictions, type FormArrayValue } from './Form';
import { Accordion, AccordionDetails, Stack, Typography } from '@mui/material';
import { AccordionHeader } from './AccordionHeader';
import { FormItem } from './FormItem';

interface ArrayWidgetProps {
  sectionTitle: string;
  items: FormArrayValue;
  itemsRestrictions: ArrayRestrictions;
}

export const ArrayWidget = ({
  sectionTitle,
  items,
  itemsRestrictions,
}: ArrayWidgetProps): ReactElement => {
  const [viewForm, setViewForm] = useState<boolean>(true);
  const [arrayRestrictions] = itemsRestrictions; // [arrayRestrictions, objectBlueprint, arrayBlueprint]

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
            {items.map((item, idx) => (
              <FormItem
                key={idx}
                sectionTitle={`Item #${idx}`}
                value={item}
                restrictions={arrayRestrictions[idx] ?? [[], null, null]}
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
