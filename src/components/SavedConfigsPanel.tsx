import React, {useEffect, useState} from 'react';
import {ConfigStorageIndex, deleteConfig, loadConfig, loadConfigIndexes} from '../models/ConfigStorage';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import DeleteIcon from '@mui/icons-material/Delete';
import {KeyConfigState} from '../types';
import {shConfigToKeyConfigState} from '../models/SHConConfig';

interface SavedConfigsPanelProps {
  onLoad(config: KeyConfigState): void;
}

export const SavedConfigsPanel: React.FC<SavedConfigsPanelProps> = ({onLoad}) => {
  const [storageIndexes, setStorageIndexes] = useState<ConfigStorageIndex[]>([]);
  useEffect(() => {
    setStorageIndexes(loadConfigIndexes());
  }, []);

  const load = (storageIndex: ConfigStorageIndex) => {
    onLoad(shConfigToKeyConfigState(storageIndex, loadConfig(storageIndex.id)));
  };

  const remove = (storageIndex: ConfigStorageIndex) => {
    if (window.confirm(`${storageIndex.label} を削除してよろしいですか？`)) {
      setStorageIndexes(deleteConfig(storageIndex.id));
    }
  };

  return (
    <List>
      {storageIndexes.map((storageIndex) => (
        <ListItem button={true} onClick={() => load(storageIndex)} key={storageIndex.id}>
          <ListItemText>{`${storageIndex.label} : ${new Date(storageIndex.createdAt).toISOString()}`}</ListItemText>
          <ListItemSecondaryAction>
            <IconButton edge="end" aria-label="delete" onClick={() => remove(storageIndex)}>
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
};
