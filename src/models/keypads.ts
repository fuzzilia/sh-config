export interface KeypadButton {
  readonly label: string;
  readonly name: string;
  readonly number: number;
  readonly isUnused?: boolean;
}

export interface KeypadStick {
  readonly label: string;
  readonly name: string;
  readonly number: number;
}

export interface Keypad {
  readonly name: string;
  readonly label: string;
  readonly id: number;
  readonly buttons: readonly KeypadButton[];
  readonly sticks: readonly KeypadStick[];
  readonly has6AxisSensor?: boolean;
}

function inferKeypadType<T extends Keypad>(keypad: T): Omit<T, 'buttons'> & Keypad {
  return keypad;
}

export const keypadJoyConL = inferKeypadType({
  name: 'joy-con-L',
  label: 'JoyCon (L)',
  id: 0x0081,
  buttons: [
    {name: 'up', number: 1, label: '↑ボタン'},
    {name: 'right', number: 2, label: '→ボタン'},
    {name: 'down', number: 0, label: '↓ボタン'},
    {name: 'left', number: 3, label: '←ボタン'},
    {name: 'minus', number: 8, label: '-ボタン'},
    {name: 'capture', number: 10, label: '撮影ボタン'},
    {name: 'stick', number: 9, label: 'スティック\n押し込み'},
    {name: 'l', number: 6, label: 'Lボタン'},
    {name: 'zl', number: 7, label: 'ZLボタン'},
    {name: 'sr', number: 4, label: 'SRボタン'},
    {name: 'sl', number: 5, label: 'SLボタン'},
  ],
  sticks: [{name: '0', number: 0, label: 'スティック'}],
  has6AxisSensor: true,
} as const);

export const keypadJoyConR = inferKeypadType({
  name: 'joy-con-R',
  label: 'JoyCon (R)',
  id: 0x0082,
  buttons: [
    {name: 'y', number: 0, label: 'Yボタン'},
    {name: 'x', number: 1, label: 'Xボタン'},
    {name: 'b', number: 2, label: 'Bボタン'},
    {name: 'a', number: 3, label: 'Aボタン'},
    {name: 'sr', number: 4, label: 'SRボタン'},
    {name: 'sl', number: 5, label: 'SLボタン'},
    {name: 'r', number: 6, label: 'Rボタン'},
    {name: 'zr', number: 7, label: 'ZRボタン'},
    {name: 'plus', number: 8, label: '+ボタン'},
    {name: 'stick', number: 9, label: 'スティック\n押し込み'},
    {name: 'home', number: 10, label: 'HOMEボタン'},
  ],
  sticks: [{name: '0', number: 0, label: 'スティック'}],
  has6AxisSensor: true,
} as const);

export const keypadShControllerV1 = inferKeypadType({
  name: 'sh-controller-v1',
  label: 'SH-Controller v1',
  id: 0x0001,
  buttons: [
    {name: '1', number: 0, label: 'ボタン1'},
    {name: '2', number: 1, label: 'ボタン2'},
    {name: '3', number: 2, label: 'ボタン3'},
    {name: '4', number: 3, label: 'ボタン4'},
    {name: '5', number: 4, label: 'ボタン5'},
    {name: '6', number: 5, label: 'ボタン6'},
    {name: '7', number: 6, label: 'ボタン7'},
    {name: '8', number: 7, label: 'ボタン8'},
    {name: '9', number: 8, label: 'ボタン9'},
    {name: '10', number: 9, label: 'ボタン10'},
  ],
  sticks: [{name: '0', number: 0, label: 'スティック'}],
  has6AxisSensor: false,
} as const);

export const keypadShControllerNrf52_v1 = inferKeypadType({
  name: 'sh-controller-nrf52-v1',
  label: 'SH-Controller nRF52 v1',
  id: 0x0002,
  buttons: [
    {name: 'up', number: 6, label: '上'},
    {name: 'upLeft', number: 10, label: '左上'},
    {name: 'upRight', number: 1, label: '右上'},
    {name: 'center', number: 2, label: '中央'},
    {name: 'downLeft', number: 3, label: '左下'},
    {name: 'downRight', number: 9, label: '右下'},
    {name: 'down', number: 5, label: '下'},
    {name: 'z1', number: 0, label: 'Z1'},
    {name: 'z2', number: 4, label: 'Z2'},
    {name: 'z3', number: 8, label: 'Z3'},
    {name: 'u1', number: 7, label: '', isUnused: true},
    {name: 'u2', number: 11, label: '', isUnused: true},
  ],
  sticks: [{name: '0', number: 0, label: 'スティック'}],
  has6AxisSensor: false,
} as const);

export const keypadShControllerNrf52_xiao_r = inferKeypadType({
  name: 'sh-controller-nrf52-v2-r',
  label: 'SH-Controller nRF52/RP2040 v2 (右手用)',
  id: 0x0003,
  buttons: [
    {name: 'u1', number: 3, label: '上1'},
    {name: 'l1', number: 4, label: '下1'},
    {name: 'u2', number: 5, label: '上2'},
    {name: 'l2', number: 6, label: '下2'},
    {name: 'u3', number: 7, label: '上3'},
    {name: 'l3', number: 8, label: '下3'},
    {name: '4', number: 9, label: '4'},
    {name: 'r', number: 0, label: 'R'},
    {name: 'l', number: 1, label: 'L'},
    {name: 'z', number: 2, label: 'Z'},
  ],
  sticks: [{name: '0', number: 0, label: 'スティック'}],
  has6AxisSensor: false,
} as const);

export const keypadShControllerNrf52_xiao_l = inferKeypadType({
  name: 'sh-controller-nrf52-v2-l',
  label: 'SH-Controller nRF52/RP2040 v2 (左手用)',
  id: 0x0004,
  buttons: [
    {name: 'u1', number: 4, label: '上1'},
    {name: 'l1', number: 3, label: '下1'},
    {name: 'u2', number: 6, label: '上2'},
    {name: 'l2', number: 5, label: '下2'},
    {name: 'u3', number: 8, label: '上3'},
    {name: 'l3', number: 7, label: '下3'},
    {name: '4', number: 9, label: '4'},
    {name: 'r', number: 0, label: 'R'},
    {name: 'l', number: 1, label: 'L'},
    {name: 'z', number: 2, label: 'Z'},
  ],
  sticks: [{name: '0', number: 0, label: 'スティック'}],
  has6AxisSensor: false,
} as const);

export const keypadShControllerNrf52_xiaoSense_r = {
  name: 'sh-controller-nrf52-v2-sense-r',
  label: 'SH-Controller nRF52 v2 (右手用/ジャイロ有)',
  id: 0x0005,
  buttons: keypadShControllerNrf52_xiao_r.buttons,
  sticks: keypadShControllerNrf52_xiao_r.sticks,
  has6AxisSensor: true,
} as const;

export const keypadShControllerNrf52_xiaoSense_l = {
  name: 'sh-controller-nrf52-v2-sense-l',
  label: 'SH-Controller nRF52 v2 (左手用/ジャイロ有)',
  id: 0x0006,
  buttons: keypadShControllerNrf52_xiao_l.buttons,
  sticks: keypadShControllerNrf52_xiao_l.sticks,
  has6AxisSensor: true,
} as const;

// export const keypads = [keypadShControllerV1, keypadJoyConL, keypadJoyConR];
export const keypads = [
  keypadShControllerNrf52_v1,
  keypadShControllerNrf52_xiao_r,
  keypadShControllerNrf52_xiao_l,
  keypadShControllerNrf52_xiaoSense_r,
  keypadShControllerNrf52_xiaoSense_l,
];

export type KeypadName = (typeof keypads)[number]['name'];
export type KeypadButtons = (typeof keypads)[number]['buttons'];

export function isJoycon(keypad: Keypad): boolean {
  return keypad.id === keypadJoyConL.id || keypad.id === keypadJoyConR.id;
}
