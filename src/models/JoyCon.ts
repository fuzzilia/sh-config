const nintendoVendorId = 0x057e;
const joyConLeftProductId = 0x2006;
const joyConRightProductId = 0x2007;
const filters = [
  {vendorId: nintendoVendorId, productId: joyConLeftProductId},
  {vendorId: nintendoVendorId, productId: joyConRightProductId},
];

const commandOutputReportId = 0x01;
const commandPadding = [...Array(9)].map(() => 0x00);
function makeCommand(subcommand: readonly number[]): Uint8Array {
  return new Uint8Array([...commandPadding, ...subcommand]);
}

export const leftJoyConButtons = [
  'down',
  'up',
  'right',
  'left',
  'sr',
  'sl',
  'l',
  'zl',
  'minus',
  'stick',
  'capture',
] as const;
export const rightJoyConButtons = ['y', 'x', 'b', 'a', 'sr', 'sl', 'r', 'zr', 'plus', 'stick', 'home'] as const;
const rightButtonOrder = [rightJoyConButtons.slice(0, 8), [undefined, 'plus', 'stick', undefined, 'home']] as const;
const leftButtonOrder = [
  ['minus', undefined, undefined, 'stick', undefined, 'capture'],
  leftJoyConButtons.slice(0, 8),
] as const;
function readButtonStatus(
  data: Uint8Array,
  dataOffset: number,
  buttonOrder: readonly (readonly (string | undefined)[])[],
): any {
  const buttonStatus = {} as any;
  buttonOrder.forEach((buttons, dataIndex) => {
    buttons.forEach((buttonName, bitIndex) => {
      if (buttonName) {
        buttonStatus[buttonName] = Boolean(data[dataOffset + dataIndex] & (0x01 << bitIndex));
      }
    });
  });
  return buttonStatus;
}

export interface JoyConStickValue {
  readonly horizontal: number;
  readonly vertical: number;
}
function readStickValue(data: Uint8Array, dataOffset: number): JoyConStickValue {
  const horizontal = data[dataOffset] | ((data[dataOffset + 1] & 0xf) << 8);
  const vertical = ((data[dataOffset + 1] >> 4) | (data[dataOffset + 2] << 4)) * -1;
  return {horizontal, vertical};
}
const capStickValue = (value: number) => Math.max(-1, Math.min(1, value));

export interface JoyConGyroValue {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}
function readGyroValue(view: DataView): JoyConGyroValue[] {
  const values: JoyConGyroValue[] = [];
  for (let i = 0; i < 3; i++) {
    values.push({
      x: readGyroScalarValue(view, 18 + i * 12),
      y: readGyroScalarValue(view, 20 + i * 12),
      z: readGyroScalarValue(view, 22 + i * 12),
    });
  }
  return values;
}
function readGyroScalarValue(view: DataView, dataOffset: number): number {
  return view.getInt16(dataOffset, true) * 0.0001694;
}

export enum JoyConInputReportMode {
  Full = 0x30,
  Simple = 0x3f,
}

enum JoyConInputReportId {
  Full = 0x30,
  Simple = 0x3f,
}

export type JoyConInputLeftButtonStatus = Readonly<Record<typeof leftJoyConButtons[number], boolean>>;
export type JoyConInputRightButtonStatus = Readonly<Record<typeof rightJoyConButtons[number], boolean>>;
export interface JoyConInputLeft {
  readonly rightOrLeft: 'left';
  readonly buttons: JoyConInputLeftButtonStatus;
  readonly stick: JoyConStickValue;
  readonly gyro: readonly JoyConGyroValue[];
}
export interface JoyConInputRight {
  readonly rightOrLeft: 'right';
  readonly buttons: JoyConInputRightButtonStatus;
  readonly stick: JoyConStickValue;
  readonly gyro: readonly JoyConGyroValue[];
}

export type JoyConInput = JoyConInputLeft | JoyConInputRight;

export class JoyCon {
  public static filters = filters;

  public readonly rightOrLeft: 'right' | 'left';
  public onInput?: (input: JoyConInput) => void;
  private imuEnabled: boolean = false;
  private inputReportMode: JoyConInputReportMode = JoyConInputReportMode.Simple;
  private stickCenter?: JoyConStickValue;

  public constructor(private readonly device: HIDDevice) {
    if (device.productId === joyConLeftProductId) {
      this.rightOrLeft = 'left';
    } else if (device.productId === joyConRightProductId) {
      this.rightOrLeft = 'right';
    } else {
      throw new Error('Unknown productId.');
    }
  }

  public async open(): Promise<void> {
    if (!this.device.opened) {
      await this.device.open();
      this.device.addEventListener('inputreport', this.onInputReport);
    }
  }

  public async close(): Promise<void> {
    if (this.device.opened) {
      if (this.imuEnabled) {
        await this.enableIMU(false);
      }
      if (this.inputReportMode !== JoyConInputReportMode.Simple) {
        await this.setInputReportMode(JoyConInputReportMode.Simple);
      }
      this.stickCenter = undefined;
      await this.device.close();
      this.device.removeEventListener('inputreport', this.onInputReport);
      this.onInput = undefined;
    }
  }

  public async setInputReportMode(mode: JoyConInputReportMode): Promise<void> {
    await this.device.sendReport(commandOutputReportId, makeCommand([0x03, mode]));
  }

  public async enableIMU(enabled = true): Promise<void> {
    await this.device.sendReport(commandOutputReportId, makeCommand([0x40, enabled ? 0x01 : 0x00]));
  }

  private onInputReport = (event: HIDInputReportEvent): void => {
    const data = new Uint8Array(event.data.buffer);
    switch (event.reportId) {
      case JoyConInputReportId.Simple:
        // TODO
        break;

      case JoyConInputReportId.Full: {
        const gyro = readGyroValue(new DataView(event.data.buffer));
        switch (this.rightOrLeft) {
          case 'left': {
            const buttons = readButtonStatus(data, 3, leftButtonOrder);
            const stick = this.normalizeStickValue(readStickValue(data, 5));
            this.onInput?.({rightOrLeft: 'left', gyro, stick, buttons});
            break;
          }
          case 'right': {
            const buttons = readButtonStatus(data, 2, rightButtonOrder);
            const stick = this.normalizeStickValue(readStickValue(data, 8));
            this.onInput?.({rightOrLeft: 'right', gyro, stick, buttons});
            break;
          }
        }
        break;
      }
    }
  };

  private normalizeStickValue(raw: JoyConStickValue): JoyConStickValue {
    if (this.stickCenter === undefined) {
      this.stickCenter = raw;
    }
    return {
      horizontal: capStickValue((raw.horizontal - this.stickCenter.horizontal) / 1900),
      vertical: capStickValue((raw.vertical - this.stickCenter.vertical) / 1900),
    };
  }
}
