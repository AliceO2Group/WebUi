import { List, ListItem, ListItemText } from '@mui/material';
import React, { useEffect, useState } from 'react';
import ConfigNavigatorItem from './ConfigNavigatorItem';

const ConfigNavigator = () => {
  const [configKeys, setConfigKeys] = useState<string[]>([]);

  const fetchConfigurationKeys = async () => {
    const res = await fetch('http://localhost:8080/api/api/configurations');
    const data = await res.json();
    console.log(data);
    setConfigKeys(data?.map((key) => key.split('/').pop()));
  };

  useEffect(() => {
    fetchConfigurationKeys();
  }, []);

  return (
    <List>
      {configKeys?.map((text) => (
        <ConfigNavigatorItem key={text} title={text} />
      ))}
    </List>
  );
};

export default ConfigNavigator;
