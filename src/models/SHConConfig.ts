import {KeypadButton, KeypadName, keypads, KeypadStick} from './keypads';
import {eightButtonDirections, fourButtonDirections} from './SHControllerManager';
import {KeyConfigByCombination, KeyConfigState} from '../types';
import {replaceAt} from './utils';
import {ConfigStorageIndex} from './ConfigStorage';
import {makeCombinations} from './KeyConfig';

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

export function keyConfigIsEmpty(config: KeyConfig | undefined): boolean {
  return !config || (!config.key && !config.ctrl && !config.shift && !config.alt && !config.gui);
}

export function shConfigForCombinationActiveCount(
  standardButtons: readonly KeypadButton[],
  sticks: readonly KeypadStick[],
  config: SHConConfigByCombination,
): number {
  return shButtonConfigsActiveCount(standardButtons, config.buttons) + shStickConfigsActiveCount(sticks, config.sticks);
}

export function shButtonConfigsActiveCount(
  standardButtons: readonly KeypadButton[],
  buttons: {readonly [key: string]: SHButtonConfig | undefined} | undefined,
): number {
  if (!buttons) {
    return 0;
  }
  return standardButtons.reduce((sum, {name}) => sum + shButtonConfigActiveCount(buttons[name]), 0);
}

export function shButtonConfigActiveCount(config: SHButtonConfig | undefined): number {
  if (!config) {
    return 0;
  }
  if (config.type !== 'motion') {
    return keyConfigIsEmpty(config.key) ? 0 : 1;
  }
  return shMotionConfigActiveCount(config.motion);
}

export function shMotionConfigActiveCount(config: SHMotionConfig): number {
  switch (config.type) {
    case 'gesture':
      return rotateAxes.reduce((sum, axis) => sum + positiveAndNegativeConfigActiveCount(config.rotate?.[axis]), 0);
    case 'rotate':
      return rotateAxes.reduce((sum, axis) => sum + positiveAndNegativeConfigActiveCount(config[axis]), 0);
  }
}

export function positiveAndNegativeConfigActiveCount(config: PositiveAndNegativeKeyConfig | undefined): number {
  if (!config) {
    return 0;
  }
  let count = 0;
  if (!keyConfigIsEmpty(config.positive)) {
    count++;
  }
  if (!keyConfigIsEmpty(config.negative)) {
    count++;
  }
  return count;
}

export function shStickConfigsActiveCount(
  keypadSticks: readonly KeypadStick[],
  sticks: {readonly [key: string]: SHStickConfig | undefined},
): number {
  if (!sticks) {
    return 0;
  }
  return keypadSticks.reduce((sum, {name}) => sum + shStickConfigActiveCount(sticks[name]), 0);
}

export function shStickConfigActiveCount(config: SHStickConfig | undefined): number {
  if (!config) {
    return 0;
  }
  switch (config.type) {
    case 'rotate':
      return positiveAndNegativeConfigActiveCount(config.key);
    case '4-button':
      return fourButtonDirections.map((direction) => !keyConfigIsEmpty(config[direction])).filter(Boolean).length;
    case '8-button':
      return eightButtonDirections.map((direction) => !keyConfigIsEmpty(config[direction])).filter(Boolean).length;
  }
}

export function setConfigForCombinationForKeyConfigState(
  prevState: KeyConfigState,
  combinationIndex: number,
  config: KeyConfigByCombination,
): KeyConfigState {
  return {...prevState, configsByCombination: replaceAt(prevState.configsByCombination, config, combinationIndex)};
}

export function setButtonConfigForKeyConfigState(
  prevState: KeyConfigState,
  combinationIndex: number,
  buttonIndex: number,
  config: SHButtonConfig,
): KeyConfigState {
  const prevConfigForCombination = prevState.configsByCombination[combinationIndex];
  return setConfigForCombinationForKeyConfigState(prevState, combinationIndex, {
    ...prevConfigForCombination,
    buttons: replaceAt(prevConfigForCombination.buttons, config, buttonIndex),
  });
}

export function setStickConfigForKeyConfigState(
  prevState: KeyConfigState,
  combinationIndex: number,
  stickIndex: number,
  config: SHStickConfig,
): KeyConfigState {
  const prevConfigForCombination = prevState.configsByCombination[combinationIndex];
  return setConfigForCombinationForKeyConfigState(prevState, combinationIndex, {
    ...prevConfigForCombination,
    sticks: replaceAt(prevConfigForCombination.sticks, config, stickIndex),
  });
}

export function shConfigCombinationKey(
  combinationButtonNames: readonly string[],
  combination: readonly boolean[],
): string {
  return combinationButtonNames.map((name, index) => (combination[index] ? name : '')).join('-');
}

export function keyConfigStateToSHConfig(state: KeyConfigState): SHConConfig {
  if (!state.selectedKeypad) {
    throw new Error('キーパッドを選択していない状態で設定に変換することはできません。');
  }
  const keypad = keypads.find((keypad) => keypad.name === state.selectedKeypad);
  if (!keypad) {
    throw new Error('キーパッドが見つかりません。');
  }

  const standardButtons = keypad.buttons.filter(
    (button) => !state.selectedCombinationButtonNames.includes(button.name),
  );
  const configsByCombination: {[key: string]: SHConConfigByCombination} = {};
  makeCombinations(state.selectedCombinationButtonNames.length).forEach((combination, combinationIndex) => {
    const configs = state.configsByCombination[combinationIndex];
    const buttons: {[key: string]: SHButtonConfig | undefined} = {};
    const sticks: {[key: string]: SHStickConfig | undefined} = {};
    standardButtons.forEach((button, buttonIndex) => {
      buttons[button.name] = configs.buttons[buttonIndex];
    });
    keypad.sticks.forEach((stick, stickIndex) => {
      sticks[stick.name] = configs.sticks[stickIndex];
    });
    const key = shConfigCombinationKey(state.selectedCombinationButtonNames, combination);
    configsByCombination[key] = {buttons, sticks};
  });
  return {
    keypadName: state.selectedKeypad,
    combinationButtonNames: state.selectedCombinationButtonNames,
    configsByCombination,
  };
}

export function shConfigToKeyConfigState(storageIndex: ConfigStorageIndex, config: SHConConfig): KeyConfigState {
  const keypad = keypads.find((keypad) => keypad.name === config.keypadName);
  if (!keypad) {
    throw new Error('invalid keypad name.');
  }
  const buttonNameSet = new Set<string>(keypad.buttons.map(({name}) => name));
  if (!Array.isArray(config.combinationButtonNames)) {
    throw new Error('combination button names is not array.');
  }
  if (!config.combinationButtonNames.every((buttonName) => buttonNameSet.has(buttonName))) {
    throw new Error('invalid combination button name.');
  }
  const commandButtons = keypad.buttons.filter((button) => !config.combinationButtonNames.includes(button.name));
  const configsByCombination: KeyConfigByCombination[] = [];
  makeCombinations(config.combinationButtonNames.length).forEach((combination) => {
    const key = shConfigCombinationKey(config.combinationButtonNames, combination);
    const configForCombination = config.configsByCombination[key];
    const buttons: (SHButtonConfig | undefined)[] = [];
    const sticks: (SHStickConfig | undefined)[] = [];
    commandButtons.forEach((button) => {
      buttons.push(configForCombination.buttons[button.name]);
    });
    keypad.sticks.forEach((stick) => {
      sticks.push(configForCombination.sticks[stick.name]);
    });
    // TODO バリデーション (結構大変なのでしばらく着手しない)
    configsByCombination.push({buttons, sticks});
  });

  return {
    ...storageIndex,
    selectedKeypad: config.keypadName,
    selectedCombinationButtonNames: config.combinationButtonNames,
    configsByCombination,
  };
}
