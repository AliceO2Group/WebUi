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

import { useState, type FC, type PropsWithChildren, type ReactElement } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import {
  Form,
  isFormRestrictions,
  type ArrayRestrictions,
  type FormItem,
  type WidgetRestrictions,
} from './Form';
import { Accordion, AccordionDetails, Stack, Typography } from '@mui/material';
import { AccordionHeader } from './AccordionHeader';

interface WidgetProps extends PropsWithChildren {
  title: string;
  type: WidgetRestrictions;
  value: unknown;
}

type ArrayWidgetProps = Omit<WidgetProps, 'type'> & { type: ArrayRestrictions };

const ArrayWidget = ({ title, type, value }: ArrayWidgetProps): ReactElement => {
  const [viewForm, setViewForm] = useState<boolean>(true);
  const items = value as Array<unknown>;
  const [itemsRestrictions] = type;

  return (
    <Accordion defaultExpanded>
      <AccordionHeader
        title={title}
        viewForm={viewForm}
        viewFormToggle={() => setViewForm((v) => !v)}
      />
      <AccordionDetails>
        {viewForm ? (
          <Stack spacing={2}>
            {items.map((item, idx) => {
              if (isFormRestrictions(itemsRestrictions[idx])) {
                return (
                  <Form
                    key={idx}
                    sectionTitle={`Item #${idx}`}
                    items={item as FormItem}
                    itemsRestrictions={itemsRestrictions[idx]}
                  />
                );
              }
              return (
                <Widget
                  key={idx}
                  title={`Item #${idx}`}
                  type={itemsRestrictions[idx]}
                  value={item}
                />
              );
            })}
          </Stack>
        ) : (
          <Typography component="pre">{JSON.stringify(items, null, 2)}</Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export const Widget: FC<WidgetProps> = ({ title, type, value }): ReactElement => {
  switch (type) {
    case 'string':
      return <TextField type="text" defaultValue={value} label={title} />;
    case 'number':
      return <TextField type="number" defaultValue={value} label={title} />;
    case 'boolean':
      return (
        <FormControlLabel control={<Switch defaultChecked={value === 'true'} />} label={title} />
      );
    default:
      return <ArrayWidget title={title} type={type} value={value} />;
  }
};
