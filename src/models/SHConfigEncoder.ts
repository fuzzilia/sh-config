import {
  KeyConfig,
  positiveAndNegativeConfigActiveCount,
  PositiveAndNegativeKeyConfig,
  shButtonConfigActiveCount,
  shButtonConfigsActiveCount,
  SHConConfig,
  SHConConfigByCombination,
  shConfigCombinationKey,
  shStickConfigActiveCount,
  shStickConfigsActiveCount,
} from './SHConConfig';
import {Keypad} from './keypads';
import {makeCombinations} from './KeyConfig';

export enum ButtonBlockType {
  Empty = 0,
  Standard = 1,
  Gesture = 2,
  Rotation = 3,
}

export enum StickBlockType {
  Empty = 0,
  Rotate = 1,
  FourButton = 2,
  EightButton = 3,
}

function keyModifierNumber(key: KeyConfig | undefined): number {
  if (!key) {
    return 0;
  }
  return (key.ctrl ? 0x01 : 0x00) | (key.shift ? 0x02 : 0x00) | (key.alt ? 0x04 : 0x00) | (key.gui ? 0x08 : 0x00);
}

function writePositiveAndNegativeKeys(writer: DataWriter, config: PositiveAndNegativeKeyConfig | undefined): void {
  writer.writeUint8(keyModifierNumber(config?.positive) | (keyModifierNumber(config?.negative) << 4));
  writer.writeUint8(config?.positive?.key ?? 0);
  writer.writeUint8(config?.negative?.key ?? 0);
}

export function encodeSHConfig(keypads: readonly Keypad[], config: SHConConfig): ArrayBuffer {
  const keypad = keypads.find((keypad) => keypad.name === config.keypadName);
  if (!keypad) {
    throw new Error('Unknown keypad ' + config.keypadName);
  }

  const sortButtons = [...keypad.buttons].sort((a, b) => a.number - b.number);
  const sortSticks = [...keypad.sticks].sort((a, b) => a.number - b.number);
  const standardButtons = sortButtons.filter((button) => !config.combinationButtonNames.includes(button.name));
  const combinationButtons = sortButtons.filter((button) => config.combinationButtonNames.includes(button.name));

  const writer = new DataWriter();

  // version 1
  writer.writeUint16(1);

  // keypad id
  writer.writeUint16(keypad.id);

  // combination button indexes
  for (let i = 0; i < 3; i++) {
    writer.writeUint8(combinationButtons[i]?.number ?? 0xff);
  }

  const writeEmptyButtonConfig = (emptyCount: number) => {
    // Empty Button Block
    writer.writeUint8(ButtonBlockType.Empty | ((emptyCount - 1) << 4));
  };

  makeCombinations(combinationButtons.length).forEach((combination) => {
    const combinationKey = shConfigCombinationKey(config.combinationButtonNames, combination);
    const configForCombination: SHConConfigByCombination | undefined = config.configsByCombination[combinationKey];
    const buttonConfigCount = shButtonConfigsActiveCount(standardButtons, configForCombination.buttons);
    const stickConfigCount = shStickConfigsActiveCount(sortSticks, configForCombination.sticks);
    const headerForCombination = (buttonConfigCount > 0 ? 0x01 : 0x00) | (stickConfigCount > 0 ? 0x02 : 0x00);
    writer.writeUint8(headerForCombination);
    if (buttonConfigCount) {
      let emptyCount = 0;
      for (const button of standardButtons) {
        const buttonConfig = configForCombination.buttons[button.name];
        if (shButtonConfigActiveCount(buttonConfig) > 0) {
          if (emptyCount > 0) {
            writeEmptyButtonConfig(emptyCount);
            emptyCount = 0;
          }
          switch (buttonConfig?.type) {
            case 'motion': {
              const {motion} = buttonConfig;
              switch (motion.type) {
                case 'gesture': {
                  const xIsActive = positiveAndNegativeConfigActiveCount(motion.rotate?.x) > 0;
                  const yIsActive = positiveAndNegativeConfigActiveCount(motion.rotate?.y) > 0;
                  const zIsActive = positiveAndNegativeConfigActiveCount(motion.rotate?.z) > 0;
                  const activeAxisData =
                    (xIsActive ? 0x01 : 0x00) | (yIsActive ? 0x02 : 0x00) | (zIsActive ? 0x04 : 0x00);
                  writer.writeUint8(ButtonBlockType.Gesture | (activeAxisData << 4));
                  if (xIsActive) {
                    writePositiveAndNegativeKeys(writer, motion.rotate?.x);
                  }
                  if (yIsActive) {
                    writePositiveAndNegativeKeys(writer, motion.rotate?.y);
                  }
                  if (zIsActive) {
                    writePositiveAndNegativeKeys(writer, motion.rotate?.z);
                  }
                  break;
                }

                case 'rotate':
                  const xSplitSize = positiveAndNegativeConfigActiveCount(motion.x) > 0 ? motion.splitSize.x : 0;
                  const ySplitSize = positiveAndNegativeConfigActiveCount(motion.y) > 0 ? motion.splitSize.y : 0;
                  const zSplitSize = positiveAndNegativeConfigActiveCount(motion.z) > 0 ? motion.splitSize.z : 0;
                  const additionalBits = motion.locksAxis ? 0x01 : 0x00;
                  writer.writeUint8(ButtonBlockType.Rotation | (additionalBits << 4));
                  writer.writeUint8(xSplitSize);
                  writer.writeUint8(ySplitSize);
                  writer.writeUint8(zSplitSize);
                  if (xSplitSize) {
                    writePositiveAndNegativeKeys(writer, motion.x);
                  }
                  if (ySplitSize) {
                    writePositiveAndNegativeKeys(writer, motion.y);
                  }
                  if (zSplitSize) {
                    writePositiveAndNegativeKeys(writer, motion.z);
                  }
                  break;
              }
              break;
            }

            // Standard Button Block
            default:
              if (!buttonConfig?.key) {
                // 空だったらshButtonConfigActiveCountが0になるので、keyは必ず存在しているはず。
                throw new Error('Unexpected error.');
              }
              writer.writeUint8(ButtonBlockType.Standard | (keyModifierNumber(buttonConfig.key) << 4));
              writer.writeUint8(buttonConfig.key.key ?? 0);
          }
        } else {
          if (emptyCount >= 15) {
            writeEmptyButtonConfig(emptyCount + 1);
            emptyCount = 0;
          } else {
            emptyCount++;
          }
        }
      }
      if (emptyCount > 0) {
        writeEmptyButtonConfig(emptyCount);
      }
    }

    if (stickConfigCount) {
      for (const stick of sortSticks) {
        const stickConfig = configForCombination.sticks[stick.name];
        if (!stickConfig || shStickConfigActiveCount(stickConfig) === 0) {
          writer.writeUint8(StickBlockType.Empty);
          continue;
        }
        switch (stickConfig.type) {
          case 'rotate':
            writer.writeUint8(StickBlockType.Rotate | ((stickConfig.splitSize >> 2) << 4));
            writePositiveAndNegativeKeys(writer, stickConfig.key);
            break;

          case '4-button': {
            const {upKey, rightKey, downKey, leftKey} = stickConfig;
            writer.writeUint8(StickBlockType.FourButton);
            writer.writeUint8(keyModifierNumber(upKey) | (keyModifierNumber(rightKey) << 4));
            writer.writeUint8(keyModifierNumber(downKey) | (keyModifierNumber(leftKey) << 4));
            writer.writeUint8(upKey?.key ?? 0);
            writer.writeUint8(rightKey?.key ?? 0);
            writer.writeUint8(downKey?.key ?? 0);
            writer.writeUint8(leftKey?.key ?? 0);
            break;
          }

          case '8-button': {
            const {upKey, upRightKey, rightKey, downRightKey, downKey, downLeftKey, leftKey, upLeftKey} = stickConfig;
            writer.writeUint8(StickBlockType.EightButton);
            writer.writeUint8(keyModifierNumber(upKey) | (keyModifierNumber(upRightKey) << 4));
            writer.writeUint8(keyModifierNumber(rightKey) | (keyModifierNumber(downRightKey) << 4));
            writer.writeUint8(keyModifierNumber(downKey) | (keyModifierNumber(downLeftKey) << 4));
            writer.writeUint8(keyModifierNumber(leftKey) | (keyModifierNumber(upLeftKey) << 4));
            writer.writeUint8(upKey?.key ?? 0);
            writer.writeUint8(upRightKey?.key ?? 0);
            writer.writeUint8(rightKey?.key ?? 0);
            writer.writeUint8(downRightKey?.key ?? 0);
            writer.writeUint8(downKey?.key ?? 0);
            writer.writeUint8(downLeftKey?.key ?? 0);
            writer.writeUint8(leftKey?.key ?? 0);
            writer.writeUint8(upLeftKey?.key ?? 0);
            break;
          }
        }
      }
    }
  });

  return writer.exportBuffer();
}

class DataWriter {
  public readonly buffer = new ArrayBuffer(2048); // 念の為大きな領域を取っておく
  private readonly view = new DataView(this.buffer);
  public offset = 0;

  public constructor() {}

  public writeUint8(value: number): void {
    this.view.setUint8(this.offset, value);
    this.offset += 1;
  }

  public writeUint16(value: number): void {
    this.view.setUint16(this.offset, value, true);
    this.offset += 2;
  }

  public exportBuffer(): ArrayBuffer {
    return this.buffer.slice(0, this.offset);
  }
}
