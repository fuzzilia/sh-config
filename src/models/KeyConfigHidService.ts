import {SHConConfig} from './SHConConfig';
import {encodeSHConfig} from './SHConfigEncoder';
import {keypads} from './keypads';
import {KeyConfigServiceCommon} from './KeyConfigService';

export const enum RequestPacketType {
  Echo,
  DumpMemory,
  SaveSettings,
  ShowSettings,
}

export const enum ResponsePacketType {
  Echo,
  DebugMessage,
  SaveSettingsReply,
}

export const enum SettingPacketType {
  Data,
  Header,
}

export const enum SettingReplyType {
  None,
  InvalidState,
  PacketReceived,
  Complete,
  InvalidPacketData,
  InvalidPacketOrder,
  InvalidSetting,
  Unknown,
}

export const CustomReportId = 0x66;

export const sampleConfigData = [
  1, 0, 4, 0, 0, 1, 2, 3, 1, 8, 1, 7, 1, 10, 1, 9, 1, 12, 1, 11, 1, 13, 33, 0, 30, 31, 0, 0, 0, 0, 0, 0, 0,
];

export function shConfigToHIDPackets(config: ArrayBuffer): Uint8Array[] {
  const packets: Uint8Array[] = [];

  {
    const arrayBuffer = new ArrayBuffer(20);
    const view = new DataView(arrayBuffer);
    view.setUint8(0, RequestPacketType.SaveSettings);
    view.setUint8(1, SettingPacketType.Header);
    view.setUint16(2, config.byteLength, true);
    packets.push(new Uint8Array(arrayBuffer));
  }

  const chunkSize = Math.ceil(config.byteLength / 16);
  for (let i = 0; i < chunkSize; i++) {
    const chunk = new Uint8Array(20);
    const head = [RequestPacketType.SaveSettings, SettingPacketType.Data, i];
    chunk.set(head, 0);
    chunk.set(new Uint8Array(config.slice(i * 16, (i + 1) * 16)), 4);
    packets.push(chunk);
  }

  return packets;
}

export class KeyConfigHidService implements KeyConfigServiceCommon {
  public static async connect(hid: HID, onClose: () => void): Promise<KeyConfigHidService | undefined> {
    // ユーザーにデバイス選択モーダルがブラウザから提示される。
    const devices = await hid.requestDevice({
      filters: [
        {
          vendorId: 0xcafe,
        },
      ],
    });

    // ユーザーが選択キャンセルした場合はから配列が返ってくる
    if (devices.length === 0) {
      return undefined;
    }

    const device = devices[0];
    await device.open();
    return new KeyConfigHidService(device, onClose);
  }

  private onReceiveInputReportEvent: (event: HIDInputReportEvent) => void;
  private sendingConfigPackets: Uint8Array[] = [];
  private replayTimeout: any;

  public constructor(public readonly device: HIDDevice, public readonly onClose: () => void) {
    let receivedDebugMessageChunks: ArrayBuffer[] = [];
    this.onReceiveInputReportEvent = async (event) => {
      console.log('xxxx input');
      if (event.reportId === CustomReportId) {
        const packetType = event.data.getUint8(0);
        switch (packetType) {
          case ResponsePacketType.DebugMessage: {
            const isLast = event.data.getUint8(1) === 0;
            event.data.buffer.slice(4);
            receivedDebugMessageChunks.push(event.data.buffer.slice(4));

            if (receivedDebugMessageChunks.length % 50 === 0) {
              console.log(`receiving... ${receivedDebugMessageChunks.length}`);
            }

            if (isLast) {
              const totalLength = receivedDebugMessageChunks.reduce((sum, d) => sum + d.byteLength, 0);
              const joined = new Uint8Array(totalLength);
              receivedDebugMessageChunks.forEach((i, index) => {
                joined.set(new Uint8Array(i), 16 * index);
              });
              console.log(`debug : ${new TextDecoder().decode(joined)}`);
              receivedDebugMessageChunks = [];
            }
            break;
          }

          case ResponsePacketType.SaveSettingsReply: {
            const replyType = event.data.getUint8(1);
            if (replyType === SettingReplyType.PacketReceived) {
              if (this.replayTimeout !== undefined) {
                clearTimeout(this.replayTimeout);
                this.replayTimeout = undefined;
              }
              const nextPacket = this.sendingConfigPackets.shift();
              if (!nextPacket) {
                console.error('No next packet.');
                break;
              }
              console.log('sendNextPacket', nextPacket);
              this.replayTimeout = setTimeout(() => {
                console.error('Reply timeout');
                this.sendingConfigPackets = [];
              }, 1000);
              await device.sendReport(CustomReportId, nextPacket);
            } else if (replyType === SettingReplyType.Complete) {
              if (this.replayTimeout !== undefined) {
                clearTimeout(this.replayTimeout);
                this.replayTimeout = undefined;
              }
              if (this.sendingConfigPackets.length !== 0) {
                console.warn('Unexpected packet remaining.');
                this.sendingConfigPackets = [];
              }
            } else {
              console.error('Receive error packet', event.data);
              this.sendingConfigPackets = [];
            }
            break;
          }

          default:
            console.log(event);
            console.log(event.data);
        }
      }
    };
    device.addEventListener('inputreport', this.onReceiveInputReportEvent);
  }

  public async writeConfig(config: SHConConfig): Promise<void> {
    const encoded = encodeSHConfig(keypads, config);
    const [header, ...restPackets] = shConfigToHIDPackets(encoded);
    this.sendingConfigPackets = restPackets;
    this.replayTimeout = setTimeout(() => {
      console.error('Reply timeout');
      this.sendingConfigPackets = [];
    }, 1000);
    await this.device.sendReport(CustomReportId, header);
  }

  public disconnect() {
    this.device.removeEventListener('inputreport', this.onReceiveInputReportEvent);
    this.device.close().then(this.onClose);
  }

  public showConfig() {
    const arrayBuffer = new ArrayBuffer(20);
    const view = new DataView(arrayBuffer);
    view.setUint8(0, RequestPacketType.ShowSettings);
    this.device.sendReport(CustomReportId, new Uint8Array(arrayBuffer));
  }
}
