export interface KeyConfig {
  readonly buttonNumber: number;
  readonly shift?: boolean;
  readonly control?: boolean;
  readonly alt?: boolean;
  readonly gui?: boolean;
  readonly key?: number;
}

export interface CombinationButtonState {
  readonly buttonNumber: number;
  readonly isOn: boolean;
}

export interface KeyConfigsByCombinationButtonState {
  readonly combinationButtonStates: readonly CombinationButtonState[];
  readonly configs: readonly KeyConfig[];
}

export interface GeneralShortCut {
  readonly shift?: boolean;
  readonly alt?: boolean;
  readonly controlOrCmd?: boolean;
  readonly key?: number;
}

export interface ShortCut {
  readonly shift?: boolean;
  readonly control?: boolean;
  readonly alt?: boolean;
  readonly gui?: boolean;
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
  MAC
}

export type Writable<T> = { -readonly [P in keyof T]: T[P] };
