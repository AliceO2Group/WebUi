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
import { Accordion, AccordionDetails, Stack } from '@mui/material';
import { AccordionHeader } from '../AccordionHeader';
import type { ArrayRestrictions, FormArrayValue } from '../../types';
import { RawViewModal } from '../../raw-view/RawViewModal';
import { Form } from '../../Form';
import type { Control } from 'react-hook-form';
import type { InputsType } from '~/routes/configuration';
import { KEY_SEPARATOR } from '../../constants';

interface ArrayWidgetProps {
  sectionTitle: string;
  sectionPrefix: string;
  items: FormArrayValue;
  itemsRestrictions: ArrayRestrictions;
  control: Control<InputsType>;
}

export const ArrayWidget = ({
  sectionTitle,
  sectionPrefix,
  items,
  itemsRestrictions,
  control,
}: ArrayWidgetProps): ReactElement => {
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [arrayRestrictions] = itemsRestrictions; // [arrayRestrictions, objectBlueprint, arrayBlueprint]

  return (
    <>
      <Accordion defaultExpanded>
        <AccordionHeader title={sectionTitle} showRawViewModal={() => setIsRawModalOpen(true)} />
        <AccordionDetails>
          <Stack spacing={2}>
            {items.map((item, idx) => (
              <Form
                key={idx}
                sectionTitle={`Item #${idx}`}
                sectionPrefix={`${sectionPrefix}${KEY_SEPARATOR}${idx}`}
                value={item}
                restrictions={arrayRestrictions[idx] ?? [[], null, null]}
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
