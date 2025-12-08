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

import { type FC } from 'react';
import Editor from '@monaco-editor/react';
import { Box } from '@mui/material';
import { Spinner } from '~/ui/spinner';

interface RawEditorProps {
  intialData: string;
  onChange: (value: string | undefined) => void;
}

export const RawEditor: FC<RawEditorProps> = ({ intialData, onChange }) => (
  <Box
    sx={{
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      overflow: 'hidden',
      height: '60vh',
    }}
  >
    <Editor
      height="100%"
      defaultLanguage="json"
      defaultValue={intialData}
      theme="light"
      onChange={onChange}
      options={{
        readOnly: false,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        fontFamily: '"Fira Code", "Roboto Mono", monospace',
        wordWrap: 'on',
        lineNumbers: 'on',
        renderLineHighlight: 'none',
        contextmenu: false,
      }}
      loading={<Spinner />}
    />
  </Box>
);
