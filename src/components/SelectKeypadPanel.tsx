import React, {ChangeEvent, useCallback, useState} from 'react';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import NativeSelect from '@mui/material/NativeSelect';
import {isJoycon, KeypadName, keypads} from '../models/keypads';
import {SavedConfigsPanel} from './SavedConfigsPanel';
import {ApplicationShortcut, KeyConfigState} from '../types';
import {defaultKeyConfigsByKeypadName, keyToKeyCode} from '../models/KeyConfig';
import {styled} from '@mui/material';
import {JoyConAlert} from './JoyConAlert';
import Button from '@mui/material/Button';

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
  onStartEditShortcut(shortcut: ApplicationShortcut): void;
}

export const SelectKeypadPanel: React.FC<SelectKeypadPanelProps> = ({onChange, onStartEditShortcut}) => {
  const [joyconKeypadName, setJoyconKeypadName] = useState<KeypadName>();
  const closeJoyconModal = useCallback(() => setJoyconKeypadName(undefined), []);
  const change = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const keypadName = e.target.value as KeypadName | null | undefined;
      if (!keypadName) {
        return;
      }
      const keypad = keypads.find(({name}) => name === keypadName);
      if (!keypad) {
        return;
      }
      if (isJoycon(keypad)) {
        setJoyconKeypadName(keypadName);
      } else {
        onChange({id: Date.now(), createdAt: Date.now(), ...defaultKeyConfigsByKeypadName[keypadName]}, false);
      }
    },
    [onChange],
  );
  const submitJoyconAlert = useCallback(() => {
    if (joyconKeypadName) {
      onChange({id: Date.now(), createdAt: Date.now(), ...defaultKeyConfigsByKeypadName[joyconKeypadName]}, false);
    }
  }, [onChange, joyconKeypadName]);
  const changeBySavedConfigsPanel = useCallback((config: KeyConfigState) => onChange(config, true), [onChange]);
  return (
    <RootBox>
      <MainCard>
        <CardHeader title="デバイスを選択して設定を作成" />
        <DeviceFormControl>
          <InputLabel htmlFor="shortcut-type">デバイス</InputLabel>
          <NativeSelect onChange={change}>
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
        <SavedConfigsPanel onLoad={changeBySavedConfigsPanel} />
      </MainCard>
      <MainCard>
        <CardHeader title="ショートカットキー定義" />
        <Button
          onClick={() =>
            onStartEditShortcut({
              applicationName: '新規アプリ',
              groups: [
                {
                  name: 'メイン',
                  shortcuts: [
                    {name: 'コピー', key: keyToKeyCode.get('C'), ctrl: true},
                    {name: 'ペースト', key: keyToKeyCode.get('X'), ctrl: true},
                  ],
                },
              ],
            })
          }>
          作成
        </Button>
      </MainCard>
      <JoyConAlert isOpen={joyconKeypadName !== undefined} onClose={closeJoyconModal} onSubmit={submitJoyconAlert} />
    </RootBox>
  );
};
