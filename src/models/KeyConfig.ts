import {
  ApplicationShortCut,
  ApplicationShortCutDefinition,
  KeyConfigByCombination,
  KeyConfigState,
  OsType,
  ShortCut,
  Writable,
} from '../types';
import {KeypadName} from './keypads';
import {scalarArrayEquals} from './utils';

export const keyCodes = [
  ['A', 0x04],
  ['B', 0x05],
  ['C', 0x06],
  ['D', 0x07],
  ['E', 0x08],
  ['F', 0x09],
  ['G', 0x0a],
  ['H', 0x0b],
  ['I', 0x0c],
  ['J', 0x0d],
  ['K', 0x0e],
  ['L', 0x0f],
  ['M', 0x10],
  ['N', 0x11],
  ['O', 0x12],
  ['P', 0x13],
  ['Q', 0x14],
  ['R', 0x15],
  ['S', 0x16],
  ['T', 0x17],
  ['U', 0x18],
  ['V', 0x19],
  ['W', 0x1a],
  ['X', 0x1b],
  ['Y', 0x1c],
  ['Z', 0x1d],
  ['1', 0x1e],
  ['2', 0x1f],
  ['3', 0x20],
  ['4', 0x21],
  ['5', 0x22],
  ['6', 0x23],
  ['7', 0x24],
  ['8', 0x25],
  ['9', 0x26],
  ['0', 0x27],
  ['Enter', 0x28],
  ['Esc', 0x29],
  ['Del', 0x2a],
  ['Tab', 0x2b],
  ['Space', 0x2c],
  // ['-', 0x2d],
  // ['=', 0x2e],
  ['[', 0x2f],
  [']', 0x30],
  // ['\\', 0x31],
  // ['#', 0x32],
  // [';', 0x33],
  // ['\'', 0x34],
  // ['W', 0x35],
  // [',', 0x36],
  // ['.', 0x37],
  // ['/', 0x38],
  // ['Caps', 0x39],
  ['F1', 0x3a],
  ['F2', 0x3b],
  ['F3', 0x3c],
  ['F4', 0x3d],
  ['F5', 0x3e],
  ['F6', 0x3f],
  ['F7', 0x40],
  ['F8', 0x41],
  ['F9', 0x42],
  ['F10', 0x43],
  ['F11', 0x44],
  ['F12', 0x45],
  // ['', 0x46],
  // ['', 0x47],
  // ['', 0x48],
  // ['', 0x49],
  // ['', 0x4a],
  // ['', 0x4b],
  // ['', 0x4c],
  // ['', 0x4d],
  // ['', 0x4e],
  // ['', 0x4f],
  // ['', 0x50],
  // ['', 0x51],
  // ['', 0x52],
  // ['', 0x53],
  // ['', 0x54],
  // ['', 0x55],
  // ['', 0x56],
  // ['', 0x57],
  // ['', 0x58],
  // ['', 0x59],
  // ['', 0x5a],
  // ['', 0x5b],
  // ['', 0x5c],
  // ['', 0x5d],
  // ['', 0x5e],
  // ['', 0x5f],
] as const;

export const keyToKeyCode = new Map<string, number>(keyCodes);
export const keyCodeToKey = new Map<number, string>(keyCodes.map(([key, code]) => [code, key]));

export const MaxButtonCount = 10;

export function combinationButtonCountToCombinationCount(combinationButtonCount: number): number {
  return Math.pow(2, combinationButtonCount);
}

export function makeCombinations(combinationButtonCount: number): boolean[][] {
  const combinationCount = combinationButtonCountToCombinationCount(combinationButtonCount);
  const combinations: boolean[][] = [];
  for (let i = 0; i < combinationCount; i++) {
    combinations[i] = [];
    for (let j = 0; j < combinationButtonCount; j++) {
      combinations[i][j] = (i >> j) % 2 === 1;
    }
  }
  return combinations;
}

export function changeSelectedCombinationButton(prev: KeyConfigState, buttonNames: readonly string[]): KeyConfigState {
  const combinations = makeCombinations(buttonNames.length);
  const prevCombinations = makeCombinations(prev.selectedCombinationButtonNames.length);
  return {
    ...prev,
    selectedCombinationButtonNames: buttonNames,
    configsByCombination: combinations.map((combination) => {
      const buttonNamesForCombination = buttonNames.filter((_, i) => combination[i]);
      for (let prevCombinationIndex = 0; prevCombinationIndex < prevCombinations.length; prevCombinationIndex++) {
        const prevCombination = prevCombinations[prevCombinationIndex];
        const prevButtonNamesForCombination = prev.selectedCombinationButtonNames.filter((_, i) => prevCombination[i]);
        if (scalarArrayEquals(buttonNamesForCombination, prevButtonNamesForCombination)) {
          return prev.configsByCombination[prevCombinationIndex];
        }
      }
      return defaultKeyConfigByCombination;
    }),
  };
}

export const MaxCombinationButtonCount = 3;
export const defaultCombinationButtons: boolean[] = [
  ...Array(MaxButtonCount - MaxCombinationButtonCount).fill(false),
  ...Array(MaxCombinationButtonCount).fill(true),
];

export const defaultKeyConfigByCombination: KeyConfigByCombination = {
  buttons: [],
  sticks: [],
};

export const defaultKeyConfigsByKeypadName: Record<KeypadName, Omit<KeyConfigState, 'id' | 'createdAt'>> = {
  'sh-controller-v1': {
    label: '名称未設定',
    selectedKeypad: 'sh-controller-v1',
    selectedCombinationButtonNames: ['8', '9', '10'],
    configsByCombination: [...Array(8)].map(() => defaultKeyConfigByCombination),
  },
  'joy-con-L': {
    label: '名称未設定',
    selectedKeypad: 'joy-con-L',
    selectedCombinationButtonNames: ['l', 'zl'],
    configsByCombination: [...Array(4)].map(() => defaultKeyConfigByCombination),
  },
  'joy-con-R': {
    label: '名称未設定',
    selectedKeypad: 'joy-con-R',
    selectedCombinationButtonNames: ['r', 'zr'],
    configsByCombination: [...Array(4)].map(() => defaultKeyConfigByCombination),
  },
};

export const applicationShortCutDefinitions: readonly ApplicationShortCutDefinition[] = [
  {
    applicationName: '一般',
    shortcuts: [
      {functionName: 'コピー', general: {controlOrCmd: true, key: keyToKeyCode.get('C')!}},
      {functionName: '切り取り', general: {controlOrCmd: true, key: keyToKeyCode.get('X')!}},
      {functionName: '貼り付け', general: {controlOrCmd: true, key: keyToKeyCode.get('V')!}},
      {functionName: '取り消し', general: {controlOrCmd: true, key: keyToKeyCode.get('Z')!}},
    ],
  },
  {
    applicationName: 'Procreate',
    shortcuts: [
      {functionName: 'ペイントツール', general: {key: keyToKeyCode.get('B')!}},
      {functionName: '消しゴム', general: {key: keyToKeyCode.get('E')!}},
      {functionName: '色選択', general: {key: keyToKeyCode.get('C')!}},
      {functionName: '選択モード', general: {key: keyToKeyCode.get('S')!}},
      {functionName: 'レイヤー', general: {key: keyToKeyCode.get('L')!}},
      {functionName: 'ブラシサイズ1%増', general: {controlOrCmd: true, key: keyToKeyCode.get(']')!}},
      {functionName: 'ブラシサイズ10%増', general: {shift: true, key: keyToKeyCode.get(']')!}},
      {functionName: 'ブラシサイズ1%減', general: {controlOrCmd: true, key: keyToKeyCode.get('[')!}},
      {functionName: 'ブラシサイズ10%減', general: {shift: true, key: keyToKeyCode.get('[')!}},
      {functionName: 'コピー', general: {controlOrCmd: true, key: keyToKeyCode.get('C')!}},
      {functionName: '切り取り', general: {controlOrCmd: true, key: keyToKeyCode.get('X')!}},
      {functionName: '貼り付け', general: {controlOrCmd: true, key: keyToKeyCode.get('V')!}},
      {functionName: '取り消し', general: {controlOrCmd: true, key: keyToKeyCode.get('Z')!}},
      {functionName: 'やり直す', general: {controlOrCmd: true, shift: true, key: keyToKeyCode.get('Z')!}},
      {functionName: 'スポイト', general: {alt: true}},
      {functionName: 'スポイト', general: {alt: true}},
    ],
  },
];

export const applicationNames = applicationShortCutDefinitions.map((definition) => definition.applicationName);

export function isEqualKey(a: number | undefined, b: number | undefined): boolean {
  return (!a && !b) || a === b;
}

export function isEqualShortCut(a: ShortCut, b: ShortCut): boolean {
  return (
    isEqualKey(a.key, b.key) && !a.shift === !b.shift && !a.ctrl === !b.ctrl && !a.alt === !b.alt && !a.gui === !b.gui
  );
}

export function applicationShortcutsForOs(
  definition: ApplicationShortCutDefinition,
  os: OsType,
): readonly ApplicationShortCut[] {
  return definition.shortcuts.map((shortcut) => {
    const applicationShortCut: Writable<ApplicationShortCut> = {functionName: shortcut.functionName};
    if (os === OsType.WINDOWS) {
      if (shortcut.general?.key) {
        applicationShortCut.key = shortcut.general.key;
      }
      applicationShortCut.shift = shortcut.general?.shift;
      applicationShortCut.alt = shortcut.general?.alt;
      applicationShortCut.ctrl = shortcut.general?.controlOrCmd;
    } else {
      if (shortcut.general?.key) {
        applicationShortCut.key = shortcut.general.key;
      }
      applicationShortCut.shift = shortcut.general?.shift;
      applicationShortCut.alt = shortcut.general?.alt;
      applicationShortCut.gui = shortcut.general?.controlOrCmd;
    }
    return applicationShortCut;
  });
}
