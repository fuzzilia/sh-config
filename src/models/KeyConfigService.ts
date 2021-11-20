import {SHConConfig} from './SHConConfig';
import {encodeSHConfig} from './SHConfigEncoder';
import {keypads} from './keypads';

const serviceUuid = '20FDDC1C-6B54-4523-A8DD-728B79F7525F'.toLowerCase();
type CharacteristicName = 'config' | 'scanningActive' | 'foundDevices';
const characteristicUuids: Record<CharacteristicName, string> = {
  config: 'AE96F2AE-7485-4B8C-8E79-B353546A47EE'.toLowerCase(),
  scanningActive: 'C3EE3AC1-C303-4E02-8ED8-A0FB0C4DD6D8'.toLowerCase(),
  foundDevices: 'DC1BEEB8-19BD-4F91-A2FD-177BA51C0593'.toLowerCase(),
};

export class KeyConfigService {
  public static async connect(bluetooth: Bluetooth): Promise<KeyConfigService | undefined> {
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
    // const scanningActive = characteristicMap.get(characteristicUuids.scanningActive);
    const scanningActive = await service.getCharacteristic(characteristicUuids.scanningActive);
    if (!scanningActive) {
      throw new Error('スキャン状態キャラクタリスティックが見つかりません。');
    }
    const foundDevices = characteristicMap.get(characteristicUuids.foundDevices);
    if (!foundDevices) {
      throw new Error('スキャン結果キャラクタリスティックが見つかりません。');
    }

    try {
      // console.log('xxxx 1');
      // if (scanningActive.properties.notify) {
      //   scanningActive.addEventListener('characteristicvaluechanged', (event) => {
      //     console.log('xxxx characteristicvaluechanged scanningActive', event);
      //   });
      //   await scanningActive.startNotifications();
      // }
      // console.log('xxxx 2');
      // if (foundDevices.properties.notify) {
      //   foundDevices.addEventListener('characteristicvaluechanged', (event) => {
      //     console.log('xxxx characteristicvaluechanged foundDevices', event);
      //   });
      //   await foundDevices.startNotifications();
      // }
    } catch (error) {
      throw new Error(`デバイスとの通信設定処理に失敗しました。 ${error}`);
    }
    return new KeyConfigService(device, gattServer, service, {config, scanningActive, foundDevices});
  }

  public constructor(
    private device: BluetoothDevice,
    private gattServer: BluetoothRemoteGATTServer,
    private service: BluetoothRemoteGATTService,
    private characteristics: Record<CharacteristicName, BluetoothRemoteGATTCharacteristic>,
  ) {
    device.addEventListener('gattserverdisconnected', () => {
      console.log('xxxx gattserverdisconnected');
    });
    // characteristics.foundDevices.addEventListener('characteristicvaluechanged', (event) => {
    //   console.log('xxxx characteristicvaluechanged foundDevices', event);
    // });
    // characteristics.scanningActive.addEventListener('characteristicvaluechanged', (event) => {
    //   console.log('xxxx characteristicvaluechanged scanningActive', event);
    // });
  }

  public async scan(): Promise<void> {
    await this.characteristics.scanningActive.readValue();
    this.characteristics.scanningActive.addEventListener('characteristicvaluechanged', (event) => {
      console.log('xxxx characteristicvaluechanged scanningActive', event);
    });
    try {
      await this.characteristics.scanningActive.startNotifications();
    } catch {}
    await this.characteristics.scanningActive.writeValue(new Uint8Array([1]));
  }

  public async writeConfig(config: SHConConfig): Promise<void> {
    const encoded = encodeSHConfig(keypads, config);
    await this.characteristics.config.writeValue(encoded);
  }
}
