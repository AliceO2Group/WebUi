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

import { useMemo, useState, type FC } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { RawEditor } from './RawEditor';

interface RawViewModalProps {
  onClose: () => void;
  title: string;
  data: unknown;
}

export const RawViewModal: FC<RawViewModalProps> = ({ onClose, title, data }) => {
  const initialFormattedData = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const [currentData, setCurrentData] = useState(initialFormattedData);

  const handleCopy = () => {
    void navigator.clipboard.writeText(currentData);
  };

  const handleEditorChange = (value: string | undefined) => {
    setCurrentData(value ?? '');
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, paddingRight: 12 }}>
        {title}

        <Box
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            display: 'flex',
            gap: 0.5,
          }}
        >
          <Tooltip title="Copy Content to Clipboard">
            <IconButton onClick={handleCopy}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Close">
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <RawEditor intialData={initialFormattedData} onChange={handleEditorChange} />
      </DialogContent>
    </Dialog>
  );
};
