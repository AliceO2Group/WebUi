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
import { AccordionHeader } from '../AccordionHeader';
import { RawViewModal } from '../../raw-view/RawViewModal';
import type { Control } from 'react-hook-form';
import { type InputsType } from '~/routes/configuration';
import type { FormObjectValue, ObjectRestrictions } from '../../types';
import { KEY_SEPARATOR } from '../../constants';
import { Form } from '../../Form';

interface ObjectWidgetProps extends PropsWithChildren {
  sectionTitle: string;
  sectionPrefix: string;
  items: FormObjectValue;
  itemsRestrictions: ObjectRestrictions;
  control: Control<InputsType>;
}

/**
 * Form component.
 * @param {ObjectWidgetProps} props - The props of the form.
 * @param {string} props.sectionTitle - The title of the section.
 * @param {string} props.sectionPrefix - The prefix of the section.
 * @param {FormItem} props.items - The items of the form.
 * @param {FormRestrictions} props.itemsRestrictions - The restrictions of the items.
 * @param {Control<InputsType>} props.control - The control of the form.
 * @returns {ReactElement} The form component.
 */
export const ObjectWidget: FC<ObjectWidgetProps> = ({
  sectionTitle,
  sectionPrefix,
  items,
  itemsRestrictions,
  control,
}) => {
  const [isRawModalOpen, setIsRawModalOpen] = useState<boolean>(false);

  return (
    <>
      <Accordion defaultExpanded>
        <AccordionHeader title={sectionTitle} showRawViewModal={() => setIsRawModalOpen(true)} />
        <AccordionDetails>
          <Stack spacing={2}>
            {Object.entries(items).map(([key, value]) => (
              <Form
                key={key}
                sectionTitle={key}
                sectionPrefix={`${sectionPrefix}${KEY_SEPARATOR}${key}`}
                value={value}
                restrictions={itemsRestrictions[key]}
                control={control}
              />
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {isRawModalOpen && (
        <RawViewModal onClose={() => setIsRawModalOpen(false)} title={sectionTitle} data={items} />
      )}
    </>
  );
};
