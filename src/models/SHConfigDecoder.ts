import {
  ModifierKeyBase,
  PositiveAndNegativeKeyConfig,
  SHButtonConfig,
  SHConConfig,
  SHConConfigByCombination,
  shConfigCombinationKey,
  SHGestureMotionConfig,
  SHRotateMotionConfig,
  SHStickConfig,
} from './SHConConfig';
import {Keypad, KeypadButton} from './keypads';
import {makeCombinations} from './KeyConfig';
import {ButtonBlockType, StickBlockType} from './SHConfigEncoder';

function numberToModifier(value: number): ModifierKeyBase {
  const ctrl = value & 0x01 ? true : undefined;
  const shift = value & 0x02 ? true : undefined;
  const alt = value & 0x04 ? true : undefined;
  const gui = value & 0x08 ? true : undefined;
  return {ctrl, shift, alt, gui};
}

function numberToKeyCode(value: number): number | undefined {
  return value === 0 ? undefined : value;
}

function readPositiveAndNegative(reader: DataReader): PositiveAndNegativeKeyConfig {
  const modifiers = reader.readUint8();
  const positiveKey = reader.readUint8();
  const negativeKey = reader.readUint8();
  return {
    positive: {...numberToModifier(modifiers & 0x0f), key: numberToKeyCode(positiveKey)},
    negative: {...numberToModifier(modifiers >> 4), key: numberToKeyCode(negativeKey)},
  };
}

export function decodeSHConfig(keypads: readonly Keypad[], buffer: ArrayBuffer): SHConConfig {
  const reader = new DataReader(buffer);

  const version = reader.readUint16();
  if (version !== 1) {
    throw new Error('Unknown config version ' + version);
  }
  const keypadId = reader.readUint16();
  const keypad = keypads.find(({id}) => id === keypadId);
  if (!keypad) {
    throw new Error('Unknown keypad id ' + keypadId);
  }
  const sortButtons = [...keypad.buttons].sort((a, b) => a.number - b.number);
  const sortSticks = [...keypad.sticks].sort((a, b) => a.number - b.number);

  const combinationButtonIndexes: number[] = [];
  for (let i = 0; i < 3; i++) {
    combinationButtonIndexes.push(reader.readUint8());
  }
  const combinationButtons: KeypadButton[] = [];
  for (let i = 0; i < 3; i++) {
    if (combinationButtonIndexes[i] === 0xff || !sortButtons[combinationButtonIndexes[i]]) {
      break;
    }
    combinationButtons.push(sortButtons[combinationButtonIndexes[i]]);
  }
  const combinationButtonNames = combinationButtons.map(({name}) => name);
  const standardButtons = sortButtons.filter(
    ({name}) => !combinationButtons.some((combinationButton) => combinationButton.name === name),
  );

  const configsByCombination: {[key: string]: SHConConfigByCombination} = {};
  makeCombinations(combinationButtons.length).forEach((combination) => {
    const buttons: {[key: string]: SHButtonConfig | undefined} = {};
    const sticks: {[key: string]: SHStickConfig | undefined} = {};

    const combinationHeadBlock = reader.readUint8();
    const buttonsExist = Boolean(combinationHeadBlock & 0x01);
    const stickExist = Boolean(combinationHeadBlock & 0x02);

    if (buttonsExist) {
      for (let i = 0; i < standardButtons.length; i++) {
        const headBlock = reader.readUint8();
        switch (headBlock & 0x0f) {
          case ButtonBlockType.Empty:
            i += headBlock >> 4;
            break;

          case ButtonBlockType.Standard: {
            const key = reader.readUint8();
            buttons[standardButtons[i].name] = {key: {...numberToModifier(headBlock >> 4), key: numberToKeyCode(key)}};
            break;
          }

          case ButtonBlockType.Gesture: {
            const xIsActive = Boolean(headBlock & 0x10);
            const yIsActive = Boolean(headBlock & 0x20);
            const zIsActive = Boolean(headBlock & 0x40);
            const x = xIsActive ? readPositiveAndNegative(reader) : undefined;
            const y = yIsActive ? readPositiveAndNegative(reader) : undefined;
            const z = zIsActive ? readPositiveAndNegative(reader) : undefined;
            const motion: SHGestureMotionConfig = {type: 'gesture', rotate: {x, y, z}};
            buttons[standardButtons[i].name] = {type: 'motion', motion};
            break;
          }

          case ButtonBlockType.Rotation: {
            const locksAxis = Boolean(headBlock & 0x10);
            const splitSize = {x: reader.readUint8(), y: reader.readUint8(), z: reader.readUint8()};
            const x = splitSize.x > 0 ? readPositiveAndNegative(reader) : undefined;
            const y = splitSize.y > 0 ? readPositiveAndNegative(reader) : undefined;
            const z = splitSize.z > 0 ? readPositiveAndNegative(reader) : undefined;
            const motion: SHRotateMotionConfig = {type: 'rotate', x, y, z, locksAxis, splitSize};
            buttons[standardButtons[i].name] = {type: 'motion', motion};
            break;
          }

          default:
            throw new Error('Invalid button block found.');
        }
      }
    }

    if (stickExist) {
      for (let i = 0; i < sortSticks.length; i++) {
        const headBlock = reader.readUint8();
        switch (headBlock & 0x0f) {
          case StickBlockType.Empty:
            break;

          case StickBlockType.Rotate: {
            const splitSize = (headBlock >> 4) << 2;
            const key = readPositiveAndNegative(reader);
            sticks[sortSticks[i].name] = {type: 'rotate', key, splitSize};
            break;
          }

          case StickBlockType.FourButton: {
            const keyModifiers = [reader.readUint8(), reader.readUint8()];
            const upKey = {...numberToModifier(keyModifiers[0] & 0x0f), key: numberToKeyCode(reader.readUint8())};
            const rightKey = {...numberToModifier(keyModifiers[0] >> 4), key: numberToKeyCode(reader.readUint8())};
            const downKey = {...numberToModifier(keyModifiers[1] & 0x0f), key: numberToKeyCode(reader.readUint8())};
            const leftKey = {...numberToModifier(keyModifiers[1] >> 4), key: numberToKeyCode(reader.readUint8())};
            sticks[sortSticks[i].name] = {type: '4-button', upKey, rightKey, downKey, leftKey};
            break;
          }

          case StickBlockType.EightButton: {
            const keyModifiers = [reader.readUint8(), reader.readUint8(), reader.readUint8(), reader.readUint8()];
            const upKey = {...numberToModifier(keyModifiers[0] & 0x0f), key: numberToKeyCode(reader.readUint8())};
            const upRightKey = {...numberToModifier(keyModifiers[0] >> 4), key: numberToKeyCode(reader.readUint8())};
            const rightKey = {...numberToModifier(keyModifiers[1] & 0x0f), key: numberToKeyCode(reader.readUint8())};
            const downRightKey = {...numberToModifier(keyModifiers[1] >> 4), key: numberToKeyCode(reader.readUint8())};
            const downKey = {...numberToModifier(keyModifiers[2] & 0x0f), key: numberToKeyCode(reader.readUint8())};
            const downLeftKey = {...numberToModifier(keyModifiers[2] >> 4), key: numberToKeyCode(reader.readUint8())};
            const leftKey = {...numberToModifier(keyModifiers[3] & 0x0f), key: numberToKeyCode(reader.readUint8())};
            const upLeftKey = {...numberToModifier(keyModifiers[3] >> 4), key: numberToKeyCode(reader.readUint8())};
            sticks[sortSticks[i].name] = {
              type: '8-button',
              upKey,
              upRightKey,
              rightKey,
              downRightKey,
              downKey,
              downLeftKey,
              leftKey,
              upLeftKey,
            };
            break;
          }
        }
      }
    }

    configsByCombination[shConfigCombinationKey(combinationButtonNames, combination)] = {buttons, sticks};
  });
  return {keypadName: keypad.name as any, configsByCombination, combinationButtonNames};
}

class DataReader {
  private view: DataView;
  private offset: number = 0;
  public constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }

  public readUint8(): number {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  public readUint16(): number {
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }
}
