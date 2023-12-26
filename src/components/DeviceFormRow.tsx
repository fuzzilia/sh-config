import React, {useCallback, useEffect, useRef, useState} from 'react';
import {FormLabel, FormOptionButton, FormRowBox, FormValueText} from './FormCommon';
import {isJoycon, Keypad} from '../models/keypads';
import {PairingModal} from './PairingModal';
import {KeyConfigService, KeyConfigServiceCommon} from '../models/KeyConfigService';
import {JoyConTestModal} from './JoyConTestModal';
import {keyConfigStateToSHConfig} from '../models/SHConConfig';
import {KeyConfigState} from '../types';
import {errorToMessage} from '../models/utils';
import {KeyConfigHidService} from '../models/KeyConfigHidService';

interface DeviceFormRowProps {
  keypad: Keypad;
  configState: KeyConfigState;
}

export const DeviceFormRow: React.FC<DeviceFormRowProps> = ({keypad, configState}) => {
  const [keyConfigService, setKeyConfigService] = useState<KeyConfigServiceCommon>();
  const keyConfigServiceRef = useRef<KeyConfigServiceCommon | undefined>();
  keyConfigServiceRef.current = keyConfigService;
  const [testModalIsOpen, setTestModalIsOpen] = useState<boolean>(false);
  const [pairingModelIsOpen, setPairingModalIsOpen] = useState<boolean>(false);
  const closeTestModal = useCallback(() => setTestModalIsOpen(false), []);
  const closePairingModal = useCallback(() => setPairingModalIsOpen(false), []);
  const openTestModal = useCallback(() => setTestModalIsOpen(true), []);
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const connect = useCallback(async () => {
    if (!keyConfigService) {
      try {
        if (!navigator.bluetooth) {
          alert('WebBLE未対応のブラウザです。');
          return;
        }
        const service = await KeyConfigService.connect(navigator.bluetooth, () => {
          setKeyConfigService(undefined);
        });
        if (!service) {
          return;
        }
        setKeyConfigService(service);
      } catch (error) {
        console.error(error);
        alert(errorToMessage(error));
      }
    }
  }, [keyConfigService]);

  const connectAsHid = useCallback(async () => {
    if (!keyConfigService) {
      try {
        if (!navigator.hid) {
          alert('WebHID未対応のブラウザです。');
          return;
        }
        const service = await KeyConfigHidService.connect(navigator.hid, () => {
          setKeyConfigService(undefined);
        });
        setKeyConfigService(service);
      } catch (error) {
        console.error(error);
        alert(errorToMessage(error));
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
      setIsWriting(true);
      await keyConfigService.writeConfig(keyConfigStateToSHConfig(configState));
      alert('書き込みに成功しました。');
    } catch (error) {
      console.error(error);
      alert(errorToMessage(error));
    } finally {
      setIsWriting(false);
    }
  }, [configState, keyConfigService]);
  const disconnect = useCallback(() => keyConfigService?.disconnect(), [keyConfigService]);
  const scan = useCallback(() => setPairingModalIsOpen(true), []);
  useEffect(() => () => keyConfigServiceRef.current?.disconnect(), []);

  return (
    <FormRowBox>
      <FormLabel>デバイス : </FormLabel>
      <FormValueText>{keypad.label}</FormValueText>
      {isJoycon(keypad) && (
        <FormOptionButton variant="outlined" color="primary" onClick={openTestModal}>
          ブラウザで試す
        </FormOptionButton>
      )}
      {keyConfigService ? (
        <>
          <FormOptionButton variant="outlined" color="primary" onClick={writeConfig} disabled={isWriting}>
            書き込み
          </FormOptionButton>
          {isJoycon(keypad) && (
            <FormOptionButton variant="outlined" color="primary" onClick={scan} disabled={isWriting}>
              ペアリング
            </FormOptionButton>
          )}
          <FormOptionButton variant="outlined" color="secondary" onClick={disconnect} disabled={isWriting}>
            切断
          </FormOptionButton>
        </>
      ) : (
        <>
          <FormOptionButton variant="outlined" color="primary" onClick={connect}>
            無線接続
          </FormOptionButton>
          <FormOptionButton variant="outlined" color="primary" onClick={connectAsHid}>
            HID接続
          </FormOptionButton>
        </>
      )}
      <JoyConTestModal keypad={keypad} onClose={closeTestModal} isOpen={testModalIsOpen} configState={configState} />
      <PairingModal
        keyConfigService={keyConfigService instanceof KeyConfigService ? keyConfigService : undefined}
        onClose={closePairingModal}
        isOpen={pairingModelIsOpen}
      />
    </FormRowBox>
  );
};
