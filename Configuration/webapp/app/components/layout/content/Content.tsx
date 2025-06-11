import { Box } from '@mui/material';
import React, { type FC, type PropsWithChildren } from 'react';
import ContentHeader from './ContentHeader';

interface ContentProps extends PropsWithChildren {}

const Content: FC<ContentProps> = ({ children }) => {
  return (
    <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
      <ContentHeader currentPath="o2/components/qc/ANY/any/TPC/tpc-general_config" />
      <Box sx={{ p: 3 }}>{children}</Box>
    </Box>
  );
};

export default Content;
