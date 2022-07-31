import {SHConConfig} from './SHConConfig';
import {encodeSHConfig} from './SHConfigEncoder';
import {keypads} from './keypads';

const serviceUuid = '20FDDC1C-6B54-4523-A8DD-728B79F7525F'.toLowerCase();
type ConnectorCharacteristicName = 'scanningActive' | 'foundDevices' | 'connect';
type CharacteristicName = 'config' | ConnectorCharacteristicName;
const characteristicUuids: Record<CharacteristicName, string> = {
  config: 'AE96F2AE-7485-4B8C-8E79-B353546A47EE'.toLowerCase(),
  scanningActive: 'C3EE3AC1-C303-4E02-8ED8-A0FB0C4DD6D8'.toLowerCase(),
  foundDevices: 'DC1BEEB8-19BD-4F91-A2FD-177BA51C0593'.toLowerCase(),
  connect: '8F343F76-0ABC-4765-823C-EEA12D530E74'.toLowerCase(),
};

interface Characteristics {
  config: BluetoothRemoteGATTCharacteristic;
  forConnector?: Record<ConnectorCharacteristicName, BluetoothRemoteGATTCharacteristic>;
}

export interface FoundBluetoothDevice {
  readonly name: string;
  readonly uuid: Uint8Array;
}

export interface BluetoothDeviceScanResult {
  readonly id: number;
  readonly devices: readonly FoundBluetoothDevice[];
}

function parsedFoundDevices(data: DataView): BluetoothDeviceScanResult {
  if (data.byteLength < 5) {
    throw new Error('Bluetoothデバイスのスキャン結果が不正なデータでした。');
  }
  const size = data.getUint8(0);
  const id = data.getUint32(1, true);
  let offset = 5;
  const devices: FoundBluetoothDevice[] = [];
  for (let i = 0; i < size; i++) {
    const segmentSize = data.getUint8(offset);
    if (offset + segmentSize > data.byteLength) {
      throw new Error('Bluetoothデバイスのスキャン結果が不正なデータでした。');
    }
    const nameOffset = 4 + 6;
    const uuid = new Uint8Array(data.buffer, offset + 4, 6);
    const name = new TextDecoder().decode(new DataView(data.buffer, offset + nameOffset, segmentSize - nameOffset));
    devices.push({name, uuid});
    offset += segmentSize;
  }
  return {id, devices};
}

interface Options {
  isConnector?: boolean;
}

export class KeyConfigService {
  public static async connect(
    bluetooth: Bluetooth,
    onClose: () => void,
    options?: Options,
  ): Promise<KeyConfigService | undefined> {
    let device: BluetoothDevice;
    let gattServer: BluetoothRemoteGATTServer;
    let service: BluetoothRemoteGATTService;
    let characteristics: BluetoothRemoteGATTCharacteristic[];

    device = await bluetooth.requestDevice({acceptAllDevices: true, optionalServices: [serviceUuid]});
    if (!device.gatt) {
      return undefined;
    }

    try {
      gattServer = await device.gatt.connect();
    } catch (error) {
      throw new Error(`接続に失敗しました。 ${error}`);
    }

    try {
      service = await gattServer.getPrimaryService(serviceUuid);
    } catch (error) {
      throw new Error(`BLEサービスが見つかりません。 ${error}`);
    }

    try {
      characteristics = await service.getCharacteristics();
    } catch (error) {
      throw new Error(`BLEキャラクタリスティックの取得ができません。 ${error}`);
    }

    const characteristicMap = new Map(characteristics.map((characteristic) => [characteristic.uuid, characteristic]));
    const config = characteristicMap.get(characteristicUuids.config);
    if (!config) {
      throw new Error('設定値キャラクタリスティックが見つかりません。');
    }

    let forConnector: Characteristics['forConnector'];
    if (options?.isConnector) {
      const scanningActive = characteristicMap.get(characteristicUuids.scanningActive);
      if (!scanningActive) {
        throw new Error('スキャン状態キャラクタリスティックが見つかりません。');
      }
      const foundDevices = characteristicMap.get(characteristicUuids.foundDevices);
      if (!foundDevices) {
        throw new Error('スキャン結果キャラクタリスティックが見つかりません。');
      }
      const connect = characteristicMap.get(characteristicUuids.connect);
      if (!connect) {
        throw new Error('接続キャラクタリスティックが見つかりません。');
      }
      try {
        await scanningActive.startNotifications();
      } catch (error) {
        throw new Error(`デバイスとの通信設定処理に失敗しました。 ${error}`);
      }
      forConnector = {scanningActive, foundDevices, connect};
    }

    return new KeyConfigService(device, gattServer, service, {config, forConnector}, onClose);
  }

  private resolveScanningEnd?: () => void;
  private rejectScanningEnd?: (error: any) => void;

  public constructor(
    private device: BluetoothDevice,
    private gattServer: BluetoothRemoteGATTServer,
    private service: BluetoothRemoteGATTService,
    private characteristics: Characteristics,
    onClose: () => void,
  ) {
    device.addEventListener('gattserverdisconnected', () => {
      this.rejectScanningEnd?.(new Error('デバイスが切断されました。'));
      this.resolveScanningEnd = undefined;
      this.rejectScanningEnd = undefined;
      onClose();
    });
    characteristics.forConnector?.scanningActive.addEventListener('characteristicvaluechanged', async (event) => {
      if (this.resolveScanningEnd) {
        const isScanning = await this.isScanning();
        if (!isScanning) {
          this.resolveScanningEnd?.();
          this.resolveScanningEnd = undefined;
          this.rejectScanningEnd = undefined;
        }
      }
    });
  }

  private async isScanning(): Promise<boolean> {
    if (!this.characteristics.forConnector) {
      return false;
    }
    const char = this.characteristics.forConnector.scanningActive;
    if (char.value) {
      return char.value.getUint8(0) !== 0;
    } else {
      const result = await char.readValue();
      return result.getUint8(0) !== 0;
    }
  }

  public async scan(): Promise<BluetoothDeviceScanResult> {
    if (!this.characteristics.forConnector) {
      throw new Error('このデバイスはBLE経由の接続設定に対応していません。');
    }
    await this.characteristics.forConnector.scanningActive.writeValue(new Uint8Array([1]));
    await new Promise<void>((resolve, reject) => {
      this.resolveScanningEnd = resolve;
      this.rejectScanningEnd = reject;
    });
    const foundDevicesData = await this.characteristics.forConnector.foundDevices.readValue();
    return parsedFoundDevices(foundDevicesData);
  }

  public async connect(id: number, deviceIndex: number, device: FoundBluetoothDevice): Promise<void> {
    if (!this.characteristics.forConnector) {
      throw new Error('このデバイスはBLE経由の接続設定に対応していません。');
    }
    const buffer = new ArrayBuffer(11);
    const view = new DataView(buffer);
    view.setUint8(0, deviceIndex);
    view.setUint32(1, id, true);
    for (let i = 0; i < 6; i++) {
      view.setUint8(5 + i, device.uuid[i]);
    }
    console.log('connect command data', buffer);
    await this.characteristics.forConnector.connect.writeValue(buffer);
  }

  public async writeConfig(config: SHConConfig): Promise<void> {
    const encoded = encodeSHConfig(keypads, config);
    await this.characteristics.config.writeValue(encoded);
  }

  public disconnect(): void {
    this.gattServer.disconnect();
  }
}
