import React, {useCallback, useRef, useState} from 'react';
import {FormLabel, FormOptionButton, FormRowBox, FormValueText} from './FormCommon';
import {isJoycon, Keypad} from '../models/keypads';
import {PairingModal} from './PairingModal';
import {KeyConfigService} from '../models/KeyConfigService';
import {JoyConTestModal} from './JoyConTestModal';
import {keyConfigStateToSHConfig} from '../models/SHConConfig';
import {KeyConfigState} from '../types';

interface DeviceFormRowProps {
  keypad: Keypad;
  configState: KeyConfigState;
}

export const DeviceFormRow: React.FC<DeviceFormRowProps> = ({keypad, configState}) => {
  const [keyConfigService, setKeyConfigService] = useState<KeyConfigService>();
  const [testModalIsOpen, setTestModalIsOpen] = useState<boolean>(false);
  const [pairingModelIsOpen, setPairingModalIsOpen] = useState<boolean>(false);
  const closeTestModal = useCallback(() => setTestModalIsOpen(false), []);
  const closePairingModal = useCallback(() => setPairingModalIsOpen(false), []);
  const openTestModal = useCallback(() => setTestModalIsOpen(true), []);
  const connect = useCallback(async () => {
    if (!keyConfigService) {
      try {
        if (!navigator.bluetooth) {
          alert('WebBLE未対応のブラウザです。');
          return;
        }
        const service = await KeyConfigService.connect(navigator.bluetooth);
        if (!service) {
          return;
        }
        setKeyConfigService(service);
      } catch (error) {
        console.error(error);
        alert(error?.message ?? '不明なエラーが発生しました。');
      }
    }
  }, [keyConfigService]);
  const writeConfig = useCallback(async () => {
    if (!keyConfigService) {
      alert('未接続です。');
      return;
    }
    if (!configState) {
      alert('設定がありません。');
      return;
    }
    try {
      await keyConfigService.writeConfig(keyConfigStateToSHConfig(configState));
    } catch (error) {
      console.error(error);
      alert(error?.message ?? '不明なエラーが発生しました。');
    }
  }, [configState, keyConfigService]);
  const scan = useCallback(() => setPairingModalIsOpen(true), []);

  return (
    <FormRowBox>
      <FormLabel>デバイス : </FormLabel>
      <FormValueText>{keypad.label}</FormValueText>
      {isJoycon(keypad) && (
        <FormOptionButton variant="outlined" color="primary" onClick={openTestModal}>
          ブラウザで試す
        </FormOptionButton>
      )}
      <FormOptionButton variant="outlined" color="primary" onClick={connect}>
        接続
      </FormOptionButton>
      <FormOptionButton variant="outlined" color="primary" onClick={writeConfig}>
        書き込み
      </FormOptionButton>
      <FormOptionButton variant="outlined" color="primary" onClick={scan}>
        ペアリング
      </FormOptionButton>
      <JoyConTestModal keypad={keypad} onClose={closeTestModal} isOpen={testModalIsOpen} configState={configState} />
      <PairingModal keyConfigServiceRef={keyConfigService} onClose={closePairingModal} isOpen={pairingModelIsOpen} />
    </FormRowBox>
  );
};
