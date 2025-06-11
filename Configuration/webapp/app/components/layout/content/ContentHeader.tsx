import { Toolbar, Typography } from '@mui/material';
import React, { type FC } from 'react';
import UserSection from '../../user-section/UserSection';

interface ContentHeaderProps {
  currentPath: string;
}

const ContentHeader: FC<ContentHeaderProps> = ({ currentPath }) => {
  return (
    <Toolbar
      style={{
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Typography variant="h5">{currentPath}</Typography>
      <UserSection userName="John D." />
    </Toolbar>
  );
};

export default ContentHeader;
