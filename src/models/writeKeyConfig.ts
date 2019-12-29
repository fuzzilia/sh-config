import { KeyConfigsByCombinationButtonState } from '../types';

const KeyConfigServiceUuid = '34216d2d-31b5-4d74-9dc2-9817ec3e6a74';
const KeyConfigCharacteristicUuid = '61b41e42-3c16-4bfc-9c8a-c53b3405969b';

function modifierDataValue(modifier: boolean | undefined, shiftSize: number): number {
  return (modifier ? 1 : 0) << shiftSize;
}

const headerBytes = 2;
function configsToData(configsByButtonState: readonly Readonly<KeyConfigsByCombinationButtonState>[]): ArrayBuffer {
  const commandButtonSize = configsByButtonState[0].configs.length;
  const dataSize = headerBytes + (configsByButtonState.length * commandButtonSize * 2);
  const buffer = new ArrayBuffer(dataSize);
  const data = new Uint8Array(buffer);
  const combinationButtonData = [0, 0];
  for (const { buttonNumber } of configsByButtonState[0].combinationButtonStates) {
    if (buttonNumber > 8) {
      combinationButtonData[1] = combinationButtonData[1] | (0x01 << (buttonNumber - 9));
    } else {
      combinationButtonData[0] = combinationButtonData[0] | (0x01 << (buttonNumber - 1));
    }
  }
  data.set(combinationButtonData);
  configsByButtonState.forEach(({ configs }, index) => {
    configs.forEach((config, configIndex) => {
      const configData = [
        modifierDataValue(config.control, 0) |
        modifierDataValue(config.shift, 1) |
        modifierDataValue(config.alt, 2) |
        modifierDataValue(config.gui, 3),
        config.key || 0
      ];
      data.set(configData, headerBytes + (commandButtonSize * 2 * index) + (configIndex * 2));
    });
  });
  console.log(data);
  return buffer;
}

let device: BluetoothDevice | undefined;

export async function writeKeyConfig(configs: readonly Readonly<KeyConfigsByCombinationButtonState>[]) {
  if (!navigator.bluetooth) {
    alert('WebBLE未対応のブラウザです。');
    return;
  }

  if (!device) {
    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [KeyConfigServiceUuid],
    });
    if (!device.gatt) {
      alert('デバイスが見つかりませんでした。');
      return;
    }
  }

  try {
    console.log('start connect');
    const gatt = await device.gatt!.connect();
    console.log('gatt');
    const services = await gatt.getPrimaryService(KeyConfigServiceUuid);
    console.log('services');
    const characteristic = await services.getCharacteristic(KeyConfigCharacteristicUuid);
    console.log('characteristic');
    const buffer = configsToData(configs);
    await characteristic.writeValue(buffer);
    alert("書き込み完了しました。");
    gatt.disconnect();
  } catch (error) {
    alert('なんかエラー出た…');
    console.error(error.toString());
  }
}
