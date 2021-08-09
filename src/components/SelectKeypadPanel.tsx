import React from 'react';
import CardHeader from '@material-ui/core/CardHeader';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import NativeSelect from '@material-ui/core/NativeSelect';
import {KeypadName, keypads} from '../models/keypads';
import {SavedConfigsPanel} from './SavedConfigsPanel';
import {KeyConfigState} from '../types';
import {defaultKeyConfigsByKeypadName} from '../models/KeyConfig';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  card: {
    margin: theme.spacing(2),
    padding: theme.spacing(2),
  },
  description: {
    alignSelf: 'flex-end',
  },
  form: {
    marginLeft: theme.spacing(2),
  },
}));

export interface SelectKeypadPanelProps {
  onChange(keyConfigState: KeyConfigState, combinationIsFixed: boolean): void;
}

export const SelectKeypadPanel: React.FC<SelectKeypadPanelProps> = ({onChange}) => {
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Card className={classes.card}>
        <CardHeader title="デバイスを選択して設定を作成" />
        <FormControl className={classes.form}>
          <InputLabel htmlFor="shortcut-type">デバイス</InputLabel>
          <NativeSelect
            onChange={(e) =>
              e.target.value &&
              onChange(
                {
                  id: Date.now(),
                  createdAt: Date.now(),
                  ...defaultKeyConfigsByKeypadName[e.target.value as KeypadName],
                },
                false,
              )
            }>
            <option value="" />
            {keypads.map(({name, label}) => (
              <option key={name} value={name}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </FormControl>
      </Card>

      <Card className={classes.card}>
        <CardHeader title="ブラウザに保存された設定をロード" />
        <SavedConfigsPanel onLoad={(config) => onChange(config, true)} />
      </Card>
    </Box>
  );
};
