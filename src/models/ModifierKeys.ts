import {ModifierKeyBase} from './SHConConfig';
import {Writable} from '../types';

export interface ModifierKey extends ModifierKeyBase {
  readonly label: string;
}

export const modifierKeys: readonly ModifierKey[] = [
  {label: ''},
  {label: 'Shift', shift: true},
  {label: 'Ctrl', ctrl: true},
  {label: 'Alt', alt: true},
  {label: 'Cmd/Win', gui: true},
  {label: 'Shift+Ctrl', shift: true, ctrl: true},
  {label: 'Shift+Alt', shift: true, alt: true},
  {label: 'Shift+Cmd/Win', shift: true, gui: true},
  {label: 'Ctrl+Alt', ctrl: true, alt: true},
  {label: 'Ctrl+Cmd/Win', ctrl: true, gui: true},
  {label: 'Alt+Cmd/Win', alt: true, gui: true},
  {label: 'Shift+Ctrl+Alt', shift: true, ctrl: true, alt: true},
  {label: 'Shift+Ctrl+Cmd/Win', shift: true, ctrl: true, gui: true},
  {label: 'Shift+Alt+Cmd/Win', shift: true, alt: true, gui: true},
  {label: 'Ctrl+Alt+Cmd/Win', ctrl: true, alt: true, gui: true},
];

const modifierKeysOrder = ['shift', 'ctrl', 'alt', 'gui'] as const;

function btons(value: boolean | undefined): string {
  return value ? '1' : '0';
}

export function modifierKeyToStringValue(key: ModifierKeyBase | undefined): string {
  return key ? modifierKeysOrder.map((orderKey) => btons(key[orderKey])).join('') : '0000';
}

export function modifierFromStringValue(value: string): ModifierKeyBase {
  const key: Writable<ModifierKeyBase> = {};
  modifierKeysOrder.forEach((orderKey, index) => {
    if (value[index] === '1') {
      key[orderKey] = true;
    }
  });
  return key;
}

export const modifierKeyOptions = modifierKeys.map((key) => ({label: key.label, value: modifierKeyToStringValue(key)}));
