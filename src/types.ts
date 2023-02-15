import {KeypadName} from './models/keypads';

export interface CombinationButtonState {
  readonly buttonNumber: number;
  readonly isOn: boolean;
}

export type SHButtonConfig = SHNormalButtonConfig | SHMotionButtonConfig;

export interface SHNormalButtonConfig {
  type?: undefined;
  key?: KeyConfig;
}

export type SHMotionConfig = SHGestureMotionConfig | SHRotateMotionConfig;

export interface SHGestureMotionConfig {
  type: 'gesture';
  rotate?: {
    x?: PositiveAndNegativeKeyConfig;
    y?: PositiveAndNegativeKeyConfig;
    z?: PositiveAndNegativeKeyConfig;
  };
}

export interface SHRotateMotionConfig {
  type: 'rotate';
  locksAxis?: boolean;
  splitSize: {
    x: number;
    y: number;
    z: number;
  };
  x?: PositiveAndNegativeKeyConfig;
  y?: PositiveAndNegativeKeyConfig;
  z?: PositiveAndNegativeKeyConfig;
}

export interface SHMotionButtonConfig {
  type: 'motion';
  motion: SHMotionConfig;
}

export type SHStickConfig = SHFourButtonStickConfig | SHEightButtonStickConfig | SHRotateStickConfig;

export interface SHFourButtonStickConfig {
  type: '4-button';
  upKey?: KeyConfig;
  rightKey?: KeyConfig;
  downKey?: KeyConfig;
  leftKey?: KeyConfig;
}

export interface SHEightButtonStickConfig {
  type: '8-button';
  upKey?: KeyConfig;
  upRightKey?: KeyConfig;
  rightKey?: KeyConfig;
  downRightKey?: KeyConfig;
  downKey?: KeyConfig;
  downLeftKey?: KeyConfig;
  leftKey?: KeyConfig;
  upLeftKey?: KeyConfig;
}

export interface PositiveAndNegativeKeyConfig {
  positive?: KeyConfig;
  negative?: KeyConfig;
}

export interface SHRotateStickConfig {
  type: 'rotate';
  splitSize: number;
  key?: PositiveAndNegativeKeyConfig;
}

export interface KeyConfigByCombination {
  buttons: (SHButtonConfig | undefined)[];
  sticks: (SHStickConfig | undefined)[];
  motion?: SHMotionConfig;
}

export interface KeyConfigState {
  readonly id: number;
  readonly label: string;
  readonly createdAt: number;
  readonly selectedKeypad?: KeypadName;
  readonly selectedCombinationButtonNames: readonly string[];
  readonly configsByCombination: readonly KeyConfigByCombination[];
}

export interface GeneralShortCut {
  readonly shift?: boolean;
  readonly alt?: boolean;
  readonly controlOrCmd?: boolean;
  readonly key?: number;
}

export interface ModifierKeyBase {
  readonly shift?: boolean;
  readonly ctrl?: boolean;
  readonly alt?: boolean;
  readonly gui?: boolean;
}

export interface KeyConfig extends ModifierKeyBase {
  readonly key?: number;
}

export interface ShortCut extends ModifierKeyBase {
  readonly key?: number;
}

export interface ApplicationShortCut extends ShortCut {
  readonly functionName: string;
}

export interface ApplicationShortCutDefinitionItem {
  readonly functionName: string;
  readonly general?: GeneralShortCut;
  readonly ios?: ShortCut;
  readonly mac?: ShortCut;
  readonly win?: ShortCut;
}

export interface ApplicationShortCutDefinition {
  readonly applicationName: string;
  readonly shortcuts: ApplicationShortCutDefinitionItem[];
}

export enum OsType {
  IOS = 1,
  WINDOWS,
  MAC,
}

export type Writable<T> = {-readonly [P in keyof T]: T[P]};

export type SetterFunc<T> = (prev: T) => T;
