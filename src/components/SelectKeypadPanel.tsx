import React from 'react';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import NativeSelect from '@mui/material/NativeSelect';
import {KeypadName, keypads} from '../models/keypads';
import {SavedConfigsPanel} from './SavedConfigsPanel';
import {KeyConfigState} from '../types';
import {defaultKeyConfigsByKeypadName} from '../models/KeyConfig';
import {styled} from '@mui/material';

const RootBox = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const MainCard = styled(Card)`
  margin: ${({theme}) => theme.spacing(2)};
  padding: ${({theme}) => theme.spacing(2)};
`;

const DeviceFormControl = styled(FormControl)`
  margin-left: ${({theme}) => theme.spacing(2)};
`;

export interface SelectKeypadPanelProps {
  onChange(keyConfigState: KeyConfigState, combinationIsFixed: boolean): void;
}

export const SelectKeypadPanel: React.FC<SelectKeypadPanelProps> = ({onChange}) => {
  return (
    <RootBox>
      <MainCard>
        <CardHeader title="デバイスを選択して設定を作成" />
        <DeviceFormControl>
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
        </DeviceFormControl>
      </MainCard>

      <MainCard>
        <CardHeader title="ブラウザに保存された設定をロード" />
        <SavedConfigsPanel onLoad={(config) => onChange(config, true)} />
      </MainCard>
    </RootBox>
  );
};
