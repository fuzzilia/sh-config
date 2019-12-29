import {
  ApplicationShortCut,
  ApplicationShortCutDefinition,
  CombinationButtonState,
  KeyConfig,
  KeyConfigsByCombinationButtonState,
  OsType,
  ShortCut, Writable
} from '../types';

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

export function selectedCombinationButtonIndexes(combinationButtons: boolean[]): number[] {
  const selectedIndexes: number[] = [];
  for (let i = 0; i < combinationButtons.length; i++) {
    if (combinationButtons[i]) {
      selectedIndexes.push(i);
    }
  }
  return selectedIndexes;
}

function buildEmptyConfigsWithoutCombinationButtons(combinationButtons: boolean[]): KeyConfig[] {
  const keyConfigs: KeyConfig[] = [];
  for (let i = 0; i < MaxButtonCount; i++) {
    if (!combinationButtons[i]) {
      keyConfigs.push({ buttonNumber: i + 1 });
    }
  }
  return keyConfigs;
}

export function buildDefaultKeyConfigsForCombinationButtons(
  combinationButtons: boolean[]
): KeyConfigsByCombinationButtonState[] {
  const selectedIndexes = selectedCombinationButtonIndexes(combinationButtons);
  if (selectedIndexes.length === 0) {
    return [{
      combinationButtonStates: [],
      configs: buildEmptyConfigsWithoutCombinationButtons(combinationButtons),
    }];
  }
  let combinationButtonStates: CombinationButtonState[][] = [
    [{ buttonNumber: selectedIndexes[0] + 1, isOn: false }],
    [{ buttonNumber: selectedIndexes[0] + 1, isOn: true }],
  ];
  for (let i = 1; i < selectedIndexes.length; i++) {
    const tmpCombinationState: CombinationButtonState[][] = [];
    combinationButtonStates.forEach((combinationButtonState) => {
      tmpCombinationState.push([...combinationButtonState, { buttonNumber: selectedIndexes[i] + 1, isOn: false }]);
    });
    combinationButtonStates.forEach((combinationButtonState) => {
      tmpCombinationState.push([...combinationButtonState, { buttonNumber: selectedIndexes[i] + 1, isOn: true }]);
    });
    combinationButtonStates = tmpCombinationState;
  }
  return combinationButtonStates.map((states) => ({
    combinationButtonStates: states,
    configs: buildEmptyConfigsWithoutCombinationButtons(combinationButtons)
  }));
}

export const MaxCombinationButtonCount = 3;
export const defaultCombinationButtons: boolean[] = [
  ...Array(MaxButtonCount - MaxCombinationButtonCount).fill(false),
  ...Array(MaxCombinationButtonCount).fill(true)
];

export const defaultKeyConfigs: readonly Readonly<KeyConfigsByCombinationButtonState>[] =
  buildDefaultKeyConfigsForCombinationButtons(defaultCombinationButtons);
const mutableDefaultKeyConfigs = defaultKeyConfigs as KeyConfigsByCombinationButtonState[];
mutableDefaultKeyConfigs[0] = {
  combinationButtonStates: defaultKeyConfigs[0].combinationButtonStates,
  configs: [
    { buttonNumber: 1, key: keyToKeyCode.get('C') },
    { buttonNumber: 2, key: keyToKeyCode.get('X') },
    { buttonNumber: 3, key: keyToKeyCode.get('V') },
    ...defaultKeyConfigs[0].configs.slice(3)
  ]
};

export const applicationShortCutDefinitions: readonly ApplicationShortCutDefinition[] = [
  {
    applicationName: '一般',
    shortcuts: [
      { functionName: 'コピー', general: { controlOrCmd: true, key: keyToKeyCode.get('C')! } },
      { functionName: '切り取り', general: { controlOrCmd: true, key: keyToKeyCode.get('X')! } },
      { functionName: '貼り付け', general: { controlOrCmd: true, key: keyToKeyCode.get('V')! } },
      { functionName: '取り消し', general: { controlOrCmd: true, key: keyToKeyCode.get('Z')! } },
    ]
  },
  {
    applicationName: 'Procreate',
    shortcuts: [
      { functionName: 'ペイントツール', general: { key: keyToKeyCode.get('B')! } },
      { functionName: '消しゴム', general: { key: keyToKeyCode.get('E')! } },
      { functionName: '色選択', general: { key: keyToKeyCode.get('C')! } },
      { functionName: '選択モード', general: { key: keyToKeyCode.get('S')! } },
      { functionName: 'レイヤー', general: { key: keyToKeyCode.get('L')! } },
      { functionName: 'ブラシサイズ1%増', general: { controlOrCmd: true, key: keyToKeyCode.get(']')! } },
      { functionName: 'ブラシサイズ10%増', general: { shift: true, key: keyToKeyCode.get(']')! } },
      { functionName: 'ブラシサイズ1%減', general: { controlOrCmd: true, key: keyToKeyCode.get('[')! } },
      { functionName: 'ブラシサイズ10%減', general: { shift: true, key: keyToKeyCode.get('[')! } },
      { functionName: 'コピー', general: { controlOrCmd: true, key: keyToKeyCode.get('C')! } },
      { functionName: '切り取り', general: { controlOrCmd: true, key: keyToKeyCode.get('X')! } },
      { functionName: '貼り付け', general: { controlOrCmd: true, key: keyToKeyCode.get('V')! } },
      { functionName: '取り消し', general: { controlOrCmd: true, key: keyToKeyCode.get('Z')! } },
      { functionName: 'やり直す', general: { controlOrCmd: true, shift: true, key: keyToKeyCode.get('Z')! } },
      { functionName: 'スポイト', general: { alt: true } },
      { functionName: 'スポイト', general: { alt: true } },
    ]
  },
];

export const applicationNames = applicationShortCutDefinitions.map((definition) => definition.applicationName);

export function isEqualKey(a: number | undefined, b: number | undefined): boolean {
  return (!a && !b) || a === b;
}

export function isEqualShortCut(a: ShortCut, b: ShortCut): boolean {
  return isEqualKey(a.key, b.key) &&
    !a.shift === !b.shift &&
    !a.control === !b.control &&
    !a.alt === !b.alt &&
    !a.gui === !b.gui;
}

export function applicationShortcutsForOs(definition: ApplicationShortCutDefinition, os: OsType): readonly ApplicationShortCut[] {
  return definition.shortcuts.map((shortcut) => {
    const applicationShortCut: Writable<ApplicationShortCut> = { functionName: shortcut.functionName };
    if (os === OsType.WINDOWS) {
      if (shortcut.general?.key) { applicationShortCut.key = shortcut.general.key; }
      applicationShortCut.shift = shortcut.general?.shift;
      applicationShortCut.alt = shortcut.general?.alt;
      applicationShortCut.control = shortcut.general?.controlOrCmd;
    } else {
      if (shortcut.general?.key) { applicationShortCut.key = shortcut.general.key; }
      applicationShortCut.shift = shortcut.general?.shift;
      applicationShortCut.alt = shortcut.general?.alt;
      applicationShortCut.gui = shortcut.general?.controlOrCmd;
    }
    return applicationShortCut;
  });
}
