import {SHButtonConfig, SHConConfig, shConfigCombinationKey, SHStickConfig} from './SHConConfig';
import {Keypad, KeypadButton, keypads, KeypadStick} from './keypads';
import {makeCombinations} from './KeyConfig';

function combinationToIndex(combination: readonly boolean[]): number {
  let index = 0;
  combination.forEach((isOn, i) => {
    if (isOn) {
      index += Math.pow(2, i);
    }
  });
  return index;
}

export class SHConfigManager {
  private keypad: Keypad;
  private readonly _combinationButtonIndexes: number[];
  private readonly _commandButtonIndexes: number[];
  private readonly _buttonConfigs: (SHButtonConfig | undefined)[][];
  private readonly _stickConfigs: (SHStickConfig | undefined)[][];
  private readonly sortButtons: readonly KeypadButton[];
  private readonly sortSticks: readonly KeypadStick[];
  public constructor(private config: SHConConfig) {
    const keypad = keypads.find((keypad) => keypad.name === config.keypadName);
    if (!keypad) {
      throw new Error(`unknown keypad ${config.keypadName}`);
    }
    this.keypad = keypad;
    this._combinationButtonIndexes = [];
    this._commandButtonIndexes = [];
    this.sortButtons = [...keypad.buttons].sort((a, b) => a.number - b.number);
    this.sortSticks = [...keypad.sticks].sort((a, b) => a.number - b.number);
    this.sortButtons.forEach((button, index) => {
      if (config.combinationButtonNames.includes(button.name)) {
        this._combinationButtonIndexes.push(index);
      } else {
        this._commandButtonIndexes.push(index);
      }
    });
    this._buttonConfigs = [];
    this._stickConfigs = [];
    makeCombinations(config.combinationButtonNames.length).forEach((combination) => {
      const combinationKey = shConfigCombinationKey(config.combinationButtonNames, combination);
      const buttons: (SHButtonConfig | undefined)[] = [];
      this.sortButtons.forEach((button) =>
        buttons.push(config.configsByCombination[combinationKey].buttons[button.name]),
      );
      this._buttonConfigs.push(buttons);
      const sticks: (SHStickConfig | undefined)[] = [];
      this.sortSticks.forEach((stick) => sticks.push(config.configsByCombination[combinationKey].sticks[stick.name]));
      this._stickConfigs.push(sticks);
    });
  }

  public combinationButtonIndexes(): readonly number[] {
    return this._combinationButtonIndexes;
  }

  public commandButtonIndexes(): readonly number[] {
    return this._commandButtonIndexes;
  }

  public buttonKey(buttonIndex: number, combination: readonly boolean[]): SHButtonConfig | undefined {
    return this._buttonConfigs[combinationToIndex(combination)][buttonIndex];
  }

  public buttonName(buttonIndex: number): string {
    return this.sortButtons[buttonIndex].name;
  }

  public stickKey(stickIndex: number, combination: readonly boolean[]): SHStickConfig | undefined {
    return this._stickConfigs[combinationToIndex(combination)][stickIndex];
  }
}
