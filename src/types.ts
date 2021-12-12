import {ModifierKeyBase, SHButtonConfig, SHMotionConfig, SHStickConfig} from './models/SHConConfig';
import {KeypadName} from './models/keypads';

export interface CombinationButtonState {
  readonly buttonNumber: number;
  readonly isOn: boolean;
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
