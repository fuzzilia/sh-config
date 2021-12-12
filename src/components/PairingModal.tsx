import React, {useCallback, useEffect, useState} from 'react';
import {BluetoothDeviceScanResult, FoundBluetoothDevice, KeyConfigService} from '../models/KeyConfigService';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';

export interface PairingModalProps {
  readonly keyConfigServiceRef: React.MutableRefObject<KeyConfigService | undefined>;
  readonly onClose: () => void;
  readonly isOpen: boolean;
}

export const PairingModal: React.FC<PairingModalProps> = ({keyConfigServiceRef, onClose, isOpen}) => {
  const [scanResult, setScanResult] = useState<BluetoothDeviceScanResult>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      (async () => {
        if (!keyConfigServiceRef.current) {
          alert('未接続です。');
          onClose();
          return;
        }
        try {
          setIsLoading(true);
          const result = await keyConfigServiceRef.current.scan();
          console.log('scan result', result);
          setScanResult(result);
        } catch (error) {
          console.error(error);
          alert(error?.message ?? '不明なエラーが発生しました。');
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [isOpen]);

  const onSelectDevice = useCallback(async (id: number, index: number, device: FoundBluetoothDevice) => {
    if (!keyConfigServiceRef.current) {
      alert('未接続です。');
      onClose();
      return;
    }
    await keyConfigServiceRef.current.connect(id, index, device);
    onClose();
  }, []);

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth={true} maxWidth="md">
      <DialogTitle>SH-Connectorとゲームパッドを接続する</DialogTitle>
      <DialogContent>
        <Grid item xs={12}>
          {isLoading && <div>デバイススキャン中...</div>}
          {!isLoading && scanResult?.devices.length === 0 && <div>デバイスが見つかりませんでした。</div>}
          <List>
            {scanResult?.devices.map((device, index) => (
              <ListItem key={index} button={true} onClick={() => onSelectDevice(scanResult!.id, index, device)}>
                <ListItemText primary={device.name} secondary={formatUuid(device.uuid)} />
              </ListItem>
            ))}
          </List>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

function formatUuid(uuid: Uint8Array) {
  return [...uuid].map((value) => value.toString(16)).join('-');
}
