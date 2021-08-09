import React, {useEffect, useState} from 'react';
import {ConfigStorageIndex, deleteConfig, loadConfig, loadConfigIndexes} from '../models/ConfigStorage';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import DeleteIcon from '@material-ui/icons/Delete';
import {KeyConfigState} from '../types';
import {shConfigToKeyConfigState} from '../models/KeyConfig';

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
