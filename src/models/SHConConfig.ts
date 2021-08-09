import {KeypadName} from './keypads';

export interface ModifierKeyBase {
  readonly shift?: boolean;
  readonly ctrl?: boolean;
  readonly alt?: boolean;
  readonly gui?: boolean;
}

export interface KeyConfig extends ModifierKeyBase {
  readonly key?: number;
}

export type SHButtonConfig = SHNormalButtonConfig | SHMotionButtonConfig;

export interface SHNormalButtonConfig {
  type?: undefined;
  key?: KeyConfig;
}

export interface SHMotionButtonConfig {
  type: 'motion';
  motion: SHMotionConfig;
}

export interface SHConConfigByCombination {
  readonly buttons: {readonly [key: string]: SHButtonConfig | undefined};
  readonly sticks: {readonly [key: string]: SHStickConfig | undefined};
  readonly motion?: SHMotionConfig;
}

export interface SHConConfig {
  readonly keypadName: KeypadName;
  readonly combinationButtonNames: readonly string[];
  readonly configsByCombination: {readonly [key: string]: SHConConfigByCombination};
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

export const defaultSHRotateMotionConfig: SHRotateMotionConfig = {
  type: 'rotate',
  splitSize: {
    x: 32,
    y: 32,
    z: 32,
  },
};

export const defaultSHGestureMotionConfig: SHGestureMotionConfig = {
  type: 'gesture',
};

export function getDefaultMotionConfigForType(type: SHMotionConfig['type']) {
  switch (type) {
    case 'rotate':
      return defaultSHRotateMotionConfig;
    case 'gesture':
      return defaultSHGestureMotionConfig;
  }
}

export const defaultSHMotionConfig: SHMotionConfig = defaultSHGestureMotionConfig;

export const defaultSHMotionButtonConfig: SHMotionButtonConfig = {
  type: 'motion',
  motion: defaultSHMotionConfig,
};

export const rotateAxes = ['x', 'y', 'z'] as const;
